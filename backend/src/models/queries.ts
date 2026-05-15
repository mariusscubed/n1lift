import { getPool, sql } from '../config/db';

// ─── User Queries ─────────────────────────────────────────────────────────────

/** Find a user by OAuth provider + provider_id */
export async function findUserByProvider(provider: string, providerId: string) {
  const pool = getPool();
  const result = await pool
    .request()
    .input('provider', sql.NVarChar(20), provider)
    .input('provider_id', sql.NVarChar(255), providerId)
    .query('SELECT * FROM Users WHERE provider = @provider AND provider_id = @provider_id');
  return result.recordset[0] ?? null;
}

/** Create a new user record */
export async function createUser(data: {
  provider: string;
  provider_id: string;
  display_name: string;
  email: string;
  avatar_url: string;
}) {
  const pool = getPool();
  const result = await pool
    .request()
    .input('provider', sql.NVarChar(20), data.provider)
    .input('provider_id', sql.NVarChar(255), data.provider_id)
    .input('display_name', sql.NVarChar(255), data.display_name)
    .input('email', sql.NVarChar(255), data.email)
    .input('avatar_url', sql.NVarChar(500), data.avatar_url)
    .query(
      `INSERT INTO Users (provider, provider_id, display_name, email, avatar_url)
       OUTPUT INSERTED.*
       VALUES (@provider, @provider_id, @display_name, @email, @avatar_url)`
    );
  return result.recordset[0];
}

/** Get user by id */
export async function getUserById(id: string) {
  const pool = getPool();
  const result = await pool
    .request()
    .input('id', sql.UniqueIdentifier, id)
    .query('SELECT * FROM Users WHERE id = @id');
  return result.recordset[0] ?? null;
}

/** Update user profile */
export async function updateUser(
  id: string,
  data: Partial<{
    display_name: string;
    home_address: string; home_lat: number; home_lng: number;
    work_address: string; work_lat: number; work_lng: number;
    vehicle_make: string; vehicle_model: string;
    seats: number; fuel_type: string;
  }>
) {
  const pool = getPool();
  const result = await pool
    .request()
    .input('id', sql.UniqueIdentifier, id)
    .input('display_name', sql.NVarChar(255), data.display_name ?? null)
    .input('home_address', sql.NVarChar(500), data.home_address ?? null)
    .input('home_lat', sql.Float, data.home_lat ?? null)
    .input('home_lng', sql.Float, data.home_lng ?? null)
    .input('work_address', sql.NVarChar(500), data.work_address ?? null)
    .input('work_lat', sql.Float, data.work_lat ?? null)
    .input('work_lng', sql.Float, data.work_lng ?? null)
    .input('vehicle_make', sql.NVarChar(100), data.vehicle_make ?? null)
    .input('vehicle_model', sql.NVarChar(100), data.vehicle_model ?? null)
    .input('seats', sql.Int, data.seats ?? null)
    .input('fuel_type', sql.NVarChar(20), data.fuel_type ?? null)
    .query(
      `UPDATE Users SET
        display_name  = COALESCE(@display_name,  display_name),
        home_address  = COALESCE(@home_address,  home_address),
        home_lat      = COALESCE(@home_lat,      home_lat),
        home_lng      = COALESCE(@home_lng,      home_lng),
        work_address  = COALESCE(@work_address,  work_address),
        work_lat      = COALESCE(@work_lat,      work_lat),
        work_lng      = COALESCE(@work_lng,      work_lng),
        vehicle_make  = COALESCE(@vehicle_make,  vehicle_make),
        vehicle_model = COALESCE(@vehicle_model, vehicle_model),
        seats         = COALESCE(@seats,         seats),
        fuel_type     = COALESCE(@fuel_type,     fuel_type)
       OUTPUT INSERTED.*
       WHERE id = @id`
    );
  return result.recordset[0] ?? null;
}

// ─── Lift Queries ─────────────────────────────────────────────────────────────

/** Create a new lift offer */
export async function createLift(data: {
  driver_id: string;
  from_address: string; from_lat: number; from_lng: number;
  to_address: string;   to_lat: number;   to_lng: number;
  departure_time: Date;
  seats_available: number;
  distance_km: number;
  fuel_cost_total: number;
  notes: string;
}) {
  const pool = getPool();
  const result = await pool
    .request()
    .input('driver_id',       sql.UniqueIdentifier, data.driver_id)
    .input('from_address',    sql.NVarChar(500),    data.from_address)
    .input('from_lat',        sql.Float,            data.from_lat)
    .input('from_lng',        sql.Float,            data.from_lng)
    .input('to_address',      sql.NVarChar(500),    data.to_address)
    .input('to_lat',          sql.Float,            data.to_lat)
    .input('to_lng',          sql.Float,            data.to_lng)
    .input('departure_time',  sql.DateTime2,        data.departure_time)
    .input('seats_available', sql.Int,              data.seats_available)
    .input('distance_km',     sql.Float,            data.distance_km)
    .input('fuel_cost_total', sql.Decimal(10, 2),   data.fuel_cost_total)
    .input('notes',           sql.NVarChar(1000),   data.notes)
    .query(
      `INSERT INTO Lifts
         (driver_id, from_address, from_lat, from_lng, to_address, to_lat, to_lng,
          departure_time, seats_available, distance_km, fuel_cost_total, notes)
       OUTPUT INSERTED.*
       VALUES
         (@driver_id, @from_address, @from_lat, @from_lng, @to_address, @to_lat, @to_lng,
          @departure_time, @seats_available, @distance_km, @fuel_cost_total, @notes)`
    );
  return result.recordset[0];
}

/** Search lifts by date and rough proximity (within ~0.5 degree lat/lng) */
export async function searchLifts(params: {
  from_lat: number; from_lng: number;
  to_lat: number;   to_lng: number;
  date: string;     seats: number;
}) {
  const pool = getPool();
  const result = await pool
    .request()
    .input('from_lat',  sql.Float, params.from_lat)
    .input('from_lng',  sql.Float, params.from_lng)
    .input('to_lat',    sql.Float, params.to_lat)
    .input('to_lng',    sql.Float, params.to_lng)
    .input('date',      sql.NVarChar(20), params.date)
    .input('seats',     sql.Int, params.seats)
    .query(
      `SELECT l.*, u.display_name, u.avatar_url, u.vehicle_make, u.vehicle_model
       FROM Lifts l
       JOIN Users u ON u.id = l.driver_id
       WHERE l.status = 'active'
         AND (l.seats_available - l.seats_taken) >= @seats
         AND CAST(l.departure_time AS DATE) = CAST(@date AS DATE)
         AND ABS(l.from_lat - @from_lat) < 0.5
         AND ABS(l.from_lng - @from_lng) < 0.5
         AND ABS(l.to_lat   - @to_lat)   < 0.5
         AND ABS(l.to_lng   - @to_lng)   < 0.5
       ORDER BY l.departure_time ASC`
    );
  return result.recordset;
}

/** Get a single lift with driver info */
export async function getLiftById(id: string) {
  const pool = getPool();
  const result = await pool
    .request()
    .input('id', sql.UniqueIdentifier, id)
    .query(
      `SELECT l.*, u.display_name, u.avatar_url, u.vehicle_make, u.vehicle_model, u.fuel_type
       FROM Lifts l
       JOIN Users u ON u.id = l.driver_id
       WHERE l.id = @id`
    );
  return result.recordset[0] ?? null;
}

/** Get all lifts for a user (as driver or passenger) */
export async function getMyLifts(userId: string) {
  const pool = getPool();
  const offered = await pool
    .request()
    .input('userId', sql.UniqueIdentifier, userId)
    .query(`SELECT * FROM Lifts WHERE driver_id = @userId ORDER BY departure_time DESC`);

  const requested = await pool
    .request()
    .input('userId', sql.UniqueIdentifier, userId)
    .query(
      `SELECT l.*, lr.status AS request_status
       FROM LiftRequests lr
       JOIN Lifts l ON l.id = lr.lift_id
       WHERE lr.passenger_id = @userId
       ORDER BY l.departure_time DESC`
    );

  return { offered: offered.recordset, requested: requested.recordset };
}

/** Cancel a lift (soft delete) */
export async function cancelLift(id: string, driverId: string) {
  const pool = getPool();
  await pool
    .request()
    .input('id', sql.UniqueIdentifier, id)
    .input('driverId', sql.UniqueIdentifier, driverId)
    .query(`UPDATE Lifts SET status = 'cancelled' WHERE id = @id AND driver_id = @driverId`);
}

// ─── Lift Request Queries ─────────────────────────────────────────────────────

/** Create a lift join request */
export async function createLiftRequest(liftId: string, passengerId: string) {
  const pool = getPool();
  const result = await pool
    .request()
    .input('lift_id',      sql.UniqueIdentifier, liftId)
    .input('passenger_id', sql.UniqueIdentifier, passengerId)
    .query(
      `INSERT INTO LiftRequests (lift_id, passenger_id)
       OUTPUT INSERTED.*
       VALUES (@lift_id, @passenger_id)`
    );
  return result.recordset[0];
}

/** Update request status (confirmed / declined) and adjust seats_taken */
export async function updateLiftRequest(
  liftId: string,
  requestId: string,
  status: 'confirmed' | 'declined'
) {
  const pool = getPool();
  await pool
    .request()
    .input('id',      sql.UniqueIdentifier, requestId)
    .input('lift_id', sql.UniqueIdentifier, liftId)
    .input('status',  sql.NVarChar(20),     status)
    .query(`UPDATE LiftRequests SET status = @status WHERE id = @id AND lift_id = @lift_id`);

  if (status === 'confirmed') {
    await pool
      .request()
      .input('lift_id', sql.UniqueIdentifier, liftId)
      .query(`UPDATE Lifts SET seats_taken = seats_taken + 1 WHERE id = @lift_id`);
  }
}
