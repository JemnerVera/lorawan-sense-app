-- Verificar esquema real de la tabla sense.correo
-- Este script verifica las columnas y constraints de la tabla correo

-- Verificar todas las columnas de la tabla correo
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'sense' 
AND table_name = 'correo'
ORDER BY ordinal_position;

-- Verificar constraints de la tabla correo
SELECT 
    constraint_name,
    constraint_type,
    column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'sense' 
AND tc.table_name = 'correo'
ORDER BY tc.constraint_name;

-- Verificar si hay constraints NOT NULL específicos
SELECT 
    column_name,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'sense' 
AND table_name = 'correo'
AND is_nullable = 'NO'
ORDER BY column_name;
