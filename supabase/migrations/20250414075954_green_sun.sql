/*
  # Create visits table and related schema updates

  1. New Tables
    - `visits`
      - `id` (uuid, primary key)
      - `appointment_id` (uuid, foreign key to appointments)
      - `identification_type` (text)
      - `identification_number` (text)
      - `fingerprint_collected` (boolean)
      - `insurance_card_number` (text)
      - `payment_type` (text)
      - `status` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on visits table
    - Add policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES appointments(id) NOT NULL,
  identification_type text NOT NULL,
  identification_number text NOT NULL,
  fingerprint_collected boolean DEFAULT false,
  insurance_card_number text,
  payment_type text NOT NULL,
  status text NOT NULL DEFAULT 'checked-in',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated users to read visits"
  ON visits
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to create visits"
  ON visits
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update visits"
  ON visits
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_visits_updated_at
    BEFORE UPDATE ON visits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();