-- Drop the restrictive UPDATE policy
DROP POLICY IF EXISTS "Users can update their customer POs" ON public.customer_pos;

-- Create a new UPDATE policy that allows all authenticated users
CREATE POLICY "Authenticated users can update customer POs"
ON public.customer_pos
FOR UPDATE
TO authenticated
USING (auth.role() = 'authenticated'::text)
WITH CHECK (auth.role() = 'authenticated'::text);