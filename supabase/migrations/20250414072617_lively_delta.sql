/*
  # Create patients table

  1. New Tables
    - `patients`
      - `id` (uuid, primary key)
      - `fullName` (text, not null)
      - `created_at` (timestamp with time zone)
      - `updated_at` (timestamp with time zone)

  2. Security
    - Enable RLS on `patients` table
    - Add policies for:
      - Authenticated users can read all patients
      - Only admins can create/update/delete patients
*/

-- Create patients table
CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fullName text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated users to read patients"
  ON patients
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admins to manage patients"
  ON patients
  USING (
    auth.jwt() ->> 'role' = 'admin'
  )
  WITH CHECK (
    auth.jwt() ->> 'role' = 'admin'
  );