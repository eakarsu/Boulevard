import { query } from '../config/database.js'

// Analytics Service - Comprehensive business analytics
export class AnalyticsService {

  // Get dashboard overview stats
  async getDashboardStats(businessId: string, period: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<any> {
    try {
      const periodMap = {
        day: "INTERVAL '1 day'",
        week: "INTERVAL '7 days'",
        month: "INTERVAL '30 days'",
        year: "INTERVAL '365 days'"
      }
      const interval = periodMap[period]

      // Revenue stats
      const revenueResult = await query(
        `SELECT
          COALESCE(SUM(p.total), 0) as total_revenue,
          COALESCE(SUM(p.tip), 0) as total_tips,
          COUNT(DISTINCT p.id) as total_transactions,
          COALESCE(AVG(p.total), 0) as avg_transaction_value
        FROM payments p
        WHERE p.business_id = $1
        AND p.status = 'completed'
        AND p.created_at >= NOW() - ${interval}`,
        [businessId]
      )

      // Appointment stats
      const appointmentResult = await query(
        `SELECT
          COUNT(*) as total_appointments,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
          COUNT(CASE WHEN status = 'no_show' THEN 1 END) as no_shows,
          COUNT(CASE WHEN status IN ('scheduled', 'confirmed') THEN 1 END) as upcoming
        FROM appointments
        WHERE business_id = $1
        AND start_time >= NOW() - ${interval}`,
        [businessId]
      )

      // Client stats
      const clientResult = await query(
        `SELECT
          COUNT(*) as total_clients,
          COUNT(CASE WHEN created_at >= NOW() - ${interval} THEN 1 END) as new_clients
        FROM clients
        WHERE business_id = $1`,
        [businessId]
      )

      // Today's appointments
      const todayResult = await query(
        `SELECT COUNT(*) as today_appointments
        FROM appointments
        WHERE business_id = $1
        AND DATE(start_time) = CURRENT_DATE
        AND status NOT IN ('cancelled')`,
        [businessId]
      )

      // Compare with previous period
      const prevRevenueResult = await query(
        `SELECT COALESCE(SUM(p.total), 0) as prev_revenue
        FROM payments p
        WHERE p.business_id = $1
        AND p.status = 'completed'
        AND p.created_at >= NOW() - ${interval} - ${interval}
        AND p.created_at < NOW() - ${interval}`,
        [businessId]
      )

      const currentRevenue = parseFloat(revenueResult.rows[0].total_revenue) || 0
      const prevRevenue = parseFloat(prevRevenueResult.rows[0].prev_revenue) || 0
      const revenueChange = prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue * 100).toFixed(1) : 0

      return {
        revenue: {
          total: currentRevenue,
          tips: parseFloat(revenueResult.rows[0].total_tips) || 0,
          transactions: parseInt(revenueResult.rows[0].total_transactions) || 0,
          avgValue: parseFloat(revenueResult.rows[0].avg_transaction_value) || 0,
          changePercent: revenueChange
        },
        appointments: {
          total: parseInt(appointmentResult.rows[0].total_appointments) || 0,
          completed: parseInt(appointmentResult.rows[0].completed) || 0,
          cancelled: parseInt(appointmentResult.rows[0].cancelled) || 0,
          noShows: parseInt(appointmentResult.rows[0].no_shows) || 0,
          upcoming: parseInt(appointmentResult.rows[0].upcoming) || 0,
          today: parseInt(todayResult.rows[0].today_appointments) || 0
        },
        clients: {
          total: parseInt(clientResult.rows[0].total_clients) || 0,
          new: parseInt(clientResult.rows[0].new_clients) || 0
        }
      }
    } catch (error) {
      console.error('Get dashboard stats error:', error)
      return null
    }
  }

  // Get revenue analytics with trends
  async getRevenueAnalytics(businessId: string, startDate: string, endDate: string, groupBy: 'day' | 'week' | 'month' = 'day'): Promise<any[]> {
    try {
      const groupByMap = {
        day: "DATE(p.created_at)",
        week: "DATE_TRUNC('week', p.created_at)",
        month: "DATE_TRUNC('month', p.created_at)"
      }

      const result = await query(
        `SELECT
          ${groupByMap[groupBy]} as period,
          COALESCE(SUM(p.total), 0) as revenue,
          COALESCE(SUM(p.tip), 0) as tips,
          COUNT(*) as transactions,
          COUNT(DISTINCT p.client_id) as unique_clients
        FROM payments p
        WHERE p.business_id = $1
        AND p.status = 'completed'
        AND p.created_at >= $2 AND p.created_at <= $3
        GROUP BY ${groupByMap[groupBy]}
        ORDER BY period ASC`,
        [businessId, startDate, endDate]
      )

      return result.rows
    } catch (error) {
      console.error('Get revenue analytics error:', error)
      return []
    }
  }

  // Get staff performance analytics
  async getStaffPerformance(businessId: string, startDate: string, endDate: string): Promise<any[]> {
    try {
      const result = await query(
        `SELECT
          s.id as staff_id,
          u.first_name,
          u.last_name,
          s.title,
          COUNT(DISTINCT a.id) as total_appointments,
          COUNT(DISTINCT CASE WHEN a.status = 'completed' THEN a.id END) as completed_appointments,
          COALESCE(SUM(CASE WHEN a.status = 'completed' THEN p.total END), 0) as total_revenue,
          COALESCE(SUM(CASE WHEN a.status = 'completed' THEN p.tip END), 0) as total_tips,
          COALESCE(AVG(r.rating), 0) as avg_rating,
          COUNT(DISTINCT r.id) as review_count,
          ROUND(COUNT(DISTINCT CASE WHEN a.status = 'completed' THEN a.id END)::numeric /
            NULLIF(COUNT(DISTINCT a.id), 0) * 100, 1) as completion_rate
        FROM staff s
        JOIN users u ON s.user_id = u.id
        LEFT JOIN appointments a ON s.id = a.staff_id
          AND a.start_time >= $2 AND a.start_time <= $3
        LEFT JOIN payments p ON a.id = p.appointment_id AND p.status = 'completed'
        LEFT JOIN reviews r ON s.id = r.staff_id
          AND r.created_at >= $2 AND r.created_at <= $3
        WHERE s.business_id = $1 AND s.is_active = true
        GROUP BY s.id, u.first_name, u.last_name, s.title
        ORDER BY total_revenue DESC`,
        [businessId, startDate, endDate]
      )

      return result.rows
    } catch (error) {
      console.error('Get staff performance error:', error)
      return []
    }
  }

  // Get service performance analytics
  async getServicePerformance(businessId: string, startDate: string, endDate: string): Promise<any[]> {
    try {
      const result = await query(
        `SELECT
          s.id as service_id,
          s.name,
          s.category_id,
          sc.name as category_name,
          s.price as base_price,
          COUNT(DISTINCT a.id) as total_bookings,
          COUNT(DISTINCT CASE WHEN a.status = 'completed' THEN a.id END) as completed_bookings,
          COUNT(DISTINCT CASE WHEN a.status = 'cancelled' THEN a.id END) as cancelled_bookings,
          COALESCE(SUM(CASE WHEN a.status = 'completed' THEN a.price END), 0) as total_revenue,
          COALESCE(AVG(CASE WHEN a.status = 'completed' THEN a.price END), 0) as avg_revenue,
          ROUND(COUNT(DISTINCT CASE WHEN a.status = 'cancelled' THEN a.id END)::numeric /
            NULLIF(COUNT(DISTINCT a.id), 0) * 100, 1) as cancellation_rate
        FROM services s
        LEFT JOIN service_categories sc ON s.category_id = sc.id
        LEFT JOIN appointments a ON s.id = a.service_id
          AND a.start_time >= $2 AND a.start_time <= $3
        WHERE s.business_id = $1 AND s.is_active = true
        GROUP BY s.id, s.name, s.category_id, sc.name, s.price
        ORDER BY total_bookings DESC`,
        [businessId, startDate, endDate]
      )

      return result.rows
    } catch (error) {
      console.error('Get service performance error:', error)
      return []
    }
  }

  // Get client insights
  async getClientInsights(businessId: string): Promise<any> {
    try {
      // Client segments
      const segmentResult = await query(
        `SELECT
          COUNT(CASE WHEN total_spent >= 1000 THEN 1 END) as vip_clients,
          COUNT(CASE WHEN total_spent >= 500 AND total_spent < 1000 THEN 1 END) as regular_clients,
          COUNT(CASE WHEN total_spent > 0 AND total_spent < 500 THEN 1 END) as occasional_clients,
          COUNT(CASE WHEN total_spent = 0 THEN 1 END) as new_clients,
          COUNT(CASE WHEN last_visit < NOW() - INTERVAL '90 days' AND total_spent > 0 THEN 1 END) as inactive_clients
        FROM clients WHERE business_id = $1`,
        [businessId]
      )

      // Top clients
      const topClientsResult = await query(
        `SELECT c.id, c.first_name, c.last_name, c.email, c.total_spent, c.loyalty_points,
          COUNT(DISTINCT a.id) as appointment_count, c.last_visit
        FROM clients c
        LEFT JOIN appointments a ON c.id = a.client_id AND a.status = 'completed'
        WHERE c.business_id = $1
        GROUP BY c.id, c.first_name, c.last_name, c.email, c.total_spent, c.loyalty_points, c.last_visit
        ORDER BY c.total_spent DESC
        LIMIT 10`,
        [businessId]
      )

      // Retention rate
      const retentionResult = await query(
        `WITH client_visits AS (
          SELECT client_id,
            COUNT(*) as visit_count,
            MAX(start_time) as last_visit
          FROM appointments
          WHERE business_id = $1 AND status = 'completed'
          GROUP BY client_id
        )
        SELECT
          COUNT(CASE WHEN visit_count > 1 THEN 1 END) as returning_clients,
          COUNT(*) as total_clients_with_visits
        FROM client_visits`,
        [businessId]
      )

      const returningClients = parseInt(retentionResult.rows[0].returning_clients) || 0
      const totalWithVisits = parseInt(retentionResult.rows[0].total_clients_with_visits) || 1
      const retentionRate = ((returningClients / totalWithVisits) * 100).toFixed(1)

      return {
        segments: segmentResult.rows[0],
        topClients: topClientsResult.rows,
        retentionRate: parseFloat(retentionRate)
      }
    } catch (error) {
      console.error('Get client insights error:', error)
      return null
    }
  }

  // Get appointment trends
  async getAppointmentTrends(businessId: string, startDate: string, endDate: string): Promise<any> {
    try {
      // By day of week
      const byDayResult = await query(
        `SELECT
          EXTRACT(DOW FROM start_time) as day_of_week,
          COUNT(*) as appointment_count
        FROM appointments
        WHERE business_id = $1
        AND start_time >= $2 AND start_time <= $3
        AND status NOT IN ('cancelled')
        GROUP BY EXTRACT(DOW FROM start_time)
        ORDER BY day_of_week`,
        [businessId, startDate, endDate]
      )

      // By hour
      const byHourResult = await query(
        `SELECT
          EXTRACT(HOUR FROM start_time) as hour,
          COUNT(*) as appointment_count
        FROM appointments
        WHERE business_id = $1
        AND start_time >= $2 AND start_time <= $3
        AND status NOT IN ('cancelled')
        GROUP BY EXTRACT(HOUR FROM start_time)
        ORDER BY hour`,
        [businessId, startDate, endDate]
      )

      // Booking sources
      const bySourceResult = await query(
        `SELECT
          source,
          COUNT(*) as count
        FROM appointments
        WHERE business_id = $1
        AND start_time >= $2 AND start_time <= $3
        GROUP BY source`,
        [businessId, startDate, endDate]
      )

      return {
        byDayOfWeek: byDayResult.rows,
        byHour: byHourResult.rows,
        bySource: bySourceResult.rows
      }
    } catch (error) {
      console.error('Get appointment trends error:', error)
      return null
    }
  }

  // Generate daily metrics (cron job)
  async generateDailyMetrics(businessId: string, date: string): Promise<void> {
    try {
      const startOfDay = `${date}T00:00:00`
      const endOfDay = `${date}T23:59:59`

      const result = await query(
        `SELECT
          COALESCE(SUM(p.total), 0) as total_revenue,
          COUNT(DISTINCT a.id) as total_appointments,
          COUNT(DISTINCT CASE WHEN a.status = 'completed' THEN a.id END) as completed_appointments,
          COUNT(DISTINCT CASE WHEN a.status = 'cancelled' THEN a.id END) as cancelled_appointments,
          COUNT(DISTINCT CASE WHEN a.status = 'no_show' THEN a.id END) as no_show_appointments,
          COALESCE(SUM(p.tip), 0) as total_tips
        FROM appointments a
        LEFT JOIN payments p ON a.id = p.appointment_id AND p.status = 'completed'
        WHERE a.business_id = $1
        AND a.start_time >= $2 AND a.start_time <= $3`,
        [businessId, startOfDay, endOfDay]
      )

      const newClientsResult = await query(
        `SELECT COUNT(*) as count FROM clients
         WHERE business_id = $1 AND DATE(created_at) = $2`,
        [businessId, date]
      )

      const returningClientsResult = await query(
        `SELECT COUNT(DISTINCT a.client_id) as count
         FROM appointments a
         JOIN (
           SELECT client_id FROM appointments
           WHERE business_id = $1 AND start_time < $2 AND status = 'completed'
         ) prev ON a.client_id = prev.client_id
         WHERE a.business_id = $1 AND DATE(a.start_time) = $2`,
        [businessId, startOfDay, date]
      )

      const metrics = result.rows[0]

      await query(
        `INSERT INTO daily_metrics (
          business_id, date, total_revenue, total_appointments, completed_appointments,
          cancelled_appointments, no_show_appointments, new_clients, returning_clients, total_tips
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (business_id, date) DO UPDATE SET
          total_revenue = EXCLUDED.total_revenue,
          total_appointments = EXCLUDED.total_appointments,
          completed_appointments = EXCLUDED.completed_appointments,
          cancelled_appointments = EXCLUDED.cancelled_appointments,
          no_show_appointments = EXCLUDED.no_show_appointments,
          new_clients = EXCLUDED.new_clients,
          returning_clients = EXCLUDED.returning_clients,
          total_tips = EXCLUDED.total_tips`,
        [
          businessId, date,
          metrics.total_revenue, metrics.total_appointments, metrics.completed_appointments,
          metrics.cancelled_appointments, metrics.no_show_appointments,
          newClientsResult.rows[0].count, returningClientsResult.rows[0].count,
          metrics.total_tips
        ]
      )
    } catch (error) {
      console.error('Generate daily metrics error:', error)
    }
  }

  // Get historical metrics
  async getHistoricalMetrics(businessId: string, startDate: string, endDate: string): Promise<any[]> {
    try {
      const result = await query(
        `SELECT * FROM daily_metrics
         WHERE business_id = $1 AND date >= $2 AND date <= $3
         ORDER BY date ASC`,
        [businessId, startDate, endDate]
      )
      return result.rows
    } catch (error) {
      console.error('Get historical metrics error:', error)
      return []
    }
  }
}

export const analyticsService = new AnalyticsService()
