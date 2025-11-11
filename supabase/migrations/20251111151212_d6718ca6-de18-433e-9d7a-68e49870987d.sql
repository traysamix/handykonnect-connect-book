-- Fix infinite recursion in profiles RLS policies
-- Drop the problematic admin check policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can update payments" ON payments;
DROP POLICY IF EXISTS "Admins can view all payments" ON payments;
DROP POLICY IF EXISTS "Admins can delete services" ON services;
DROP POLICY IF EXISTS "Admins can insert services" ON services;
DROP POLICY IF EXISTS "Admins can update services" ON services;
DROP POLICY IF EXISTS "Admins can view all services" ON services;

-- Create a function to check if user is admin without recursion
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Recreate admin policies using the function
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can update bookings"
  ON bookings FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can view all bookings"
  ON bookings FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can update payments"
  ON payments FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can view all payments"
  ON payments FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can delete services"
  ON services FOR DELETE
  USING (is_admin());

CREATE POLICY "Admins can insert services"
  ON services FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update services"
  ON services FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can view all services"
  ON services FOR SELECT
  USING (is_admin());