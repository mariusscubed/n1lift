-- N1Lift Database Schema
-- Microsoft SQL Server

USE n1lift;
GO

-- ============================================================
-- Users
-- ============================================================
CREATE TABLE Users (
  id            UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  provider      NVARCHAR(20)  NOT NULL,        -- 'google' | 'facebook' | 'apple' | 'whatsapp'
  provider_id   NVARCHAR(255) NOT NULL,
  display_name  NVARCHAR(255),
  email         NVARCHAR(255),
  avatar_url    NVARCHAR(500),
  phone_number  NVARCHAR(20),                  -- E.164 format e.g. +447700900000
  home_address  NVARCHAR(500),
  home_lat      FLOAT,
  home_lng      FLOAT,
  work_address  NVARCHAR(500),
  work_lat      FLOAT,
  work_lng      FLOAT,
  vehicle_make  NVARCHAR(100),
  vehicle_model NVARCHAR(100),
  seats         INT          DEFAULT 1,
  fuel_type     NVARCHAR(20),                  -- 'Petrol' | 'Diesel' | 'Electric'
  created_at    DATETIME2    DEFAULT GETDATE(),
  CONSTRAINT UQ_Users_Provider UNIQUE (provider, provider_id)
);
GO

-- ============================================================
-- Lifts
-- ============================================================
CREATE TABLE Lifts (
  id              UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  driver_id       UNIQUEIDENTIFIER NOT NULL REFERENCES Users(id),
  from_address    NVARCHAR(500)    NOT NULL,
  from_lat        FLOAT            NOT NULL,
  from_lng        FLOAT            NOT NULL,
  to_address      NVARCHAR(500)    NOT NULL,
  to_lat          FLOAT            NOT NULL,
  to_lng          FLOAT            NOT NULL,
  departure_time  DATETIME2        NOT NULL,
  seats_available INT              NOT NULL,
  seats_taken     INT              DEFAULT 0,
  distance_km     FLOAT,
  fuel_cost_total DECIMAL(10, 2),
  notes           NVARCHAR(1000),
  status          NVARCHAR(20)     DEFAULT 'active', -- 'active' | 'cancelled' | 'completed'
  created_at      DATETIME2        DEFAULT GETDATE()
);
GO

-- ============================================================
-- Lift Requests
-- ============================================================
CREATE TABLE LiftRequests (
  id           UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  lift_id      UNIQUEIDENTIFIER NOT NULL REFERENCES Lifts(id),
  passenger_id UNIQUEIDENTIFIER NOT NULL REFERENCES Users(id),
  status       NVARCHAR(20)     DEFAULT 'pending', -- 'pending' | 'confirmed' | 'declined'
  created_at   DATETIME2        DEFAULT GETDATE(),
  CONSTRAINT UQ_LiftRequests UNIQUE (lift_id, passenger_id)
);
GO

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IX_Lifts_DepartureTime  ON Lifts(departure_time);
CREATE INDEX IX_Lifts_DriverId       ON Lifts(driver_id);
CREATE INDEX IX_LiftRequests_LiftId  ON LiftRequests(lift_id);
CREATE INDEX IX_LiftRequests_PassId  ON LiftRequests(passenger_id);
CREATE INDEX IX_Users_PhoneNumber    ON Users(phone_number);
GO
