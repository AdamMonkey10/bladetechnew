-- Clean up existing generic suppliers
DELETE FROM public.suppliers WHERE name IN ('Supplier A', 'Supplier B', 'Supplier C');

-- Insert the real supplier with cleaned name
INSERT INTO public.suppliers (name) VALUES ('Dakin Flathers');