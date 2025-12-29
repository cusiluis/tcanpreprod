-- ============================================================================
-- FUNCIÓN: pago_put
-- Actualizar estado y verificación de un pago
-- ============================================================================
CREATE OR REPLACE FUNCTION pago_put(
    p_id INT,
    p_nuevo_estado estado_pago,
    p_nueva_verificacion BOOLEAN,
    p_verificado_por_usuario_id INT
)
RETURNS JSON AS $$
DECLARE
    v_pago_actualizado RECORD;
BEGIN
    UPDATE pagos
    SET
        estado = p_nuevo_estado,
        esta_verificado = p_nueva_verificacion,
        verificado_por_usuario_id = CASE 
            WHEN p_nueva_verificacion = TRUE THEN p_verificado_por_usuario_id 
            ELSE verificado_por_usuario_id 
        END,
        fecha_verificacion = CASE 
            WHEN p_nueva_verificacion = TRUE THEN NOW() 
            ELSE fecha_verificacion 
        END,
        fecha_actualizacion = NOW()
    WHERE id = p_id AND esta_activo = TRUE
    RETURNING * INTO v_pago_actualizado;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'status', 404,
            'message', 'Pago con ID ' || p_id || ' no encontrado.',
            'data', NULL
        );
    END IF;

    RETURN json_build_object(
        'status', 200,
        'message', 'Estado y verificación del pago actualizados exitosamente',
        'data', row_to_json(v_pago_actualizado)
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCIÓN: pago_delete
-- Desactivar un pago (soft delete)
-- ============================================================================
CREATE OR REPLACE FUNCTION pago_delete(p_id INT)
RETURNS JSON AS $$
DECLARE
    v_filas_afectadas INT;
    v_pago_eliminado RECORD;
BEGIN
    -- Obtener datos del pago antes de desactivarlo
    SELECT * INTO v_pago_eliminado FROM pagos 
    WHERE id = p_id AND esta_activo = TRUE;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'status', 404,
            'message', 'Pago con ID ' || p_id || ' no encontrado o ya estaba desactivado.',
            'data', NULL
        );
    END IF;

    -- Desactivar el pago
    UPDATE pagos
    SET esta_activo = FALSE, fecha_actualizacion = NOW()
    WHERE id = p_id AND esta_activo = TRUE;

    GET DIAGNOSTICS v_filas_afectadas = ROW_COUNT;

    IF v_filas_afectadas = 0 THEN
        RETURN json_build_object(
            'status', 500,
            'message', 'Error al desactivar el pago.',
            'data', NULL
        );
    END IF;

    RETURN json_build_object(
        'status', 200,
        'message', 'Pago desactivado exitosamente',
        'data', row_to_json(v_pago_eliminado)
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCIÓN: pago_delete_permanente
-- Eliminar un pago permanentemente y revertir cargo en tarjeta
-- ============================================================================
CREATE OR REPLACE FUNCTION pago_delete_permanente(p_id INT)
RETURNS JSON AS $$
DECLARE
    v_pago_a_eliminar RECORD;
    v_reversion_tarjeta JSON;
BEGIN
    -- 1. Obtener los datos del pago antes de eliminarlo
    SELECT * INTO v_pago_a_eliminar FROM pagos 
    WHERE id = p_id AND esta_activo = TRUE;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'status', 404,
            'message', 'Pago con ID ' || p_id || ' no encontrado o ya está desactivado.',
            'data', NULL
        );
    END IF;

    -- 2. Revertir el cargo en la tarjeta (sumar el monto al saldo)
    UPDATE tarjetas
    SET saldo = saldo + v_pago_a_eliminar.monto,
        fecha_actualizacion = NOW()
    WHERE id = v_pago_a_eliminar.tarjeta_id;

    -- 3. Eliminar el pago permanentemente
    DELETE FROM pagos WHERE id = p_id;

    -- 4. Devolver una respuesta de éxito
    RETURN json_build_object(
        'status', 200,
        'message', 'Pago eliminado permanentemente y cargo revertido exitosamente',
        'data', json_build_object(
            'pago_eliminado', row_to_json(v_pago_a_eliminar),
            'saldo_revertido', v_pago_a_eliminar.monto
        )
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'status', 500,
            'message', 'Error al eliminar el pago: ' || SQLERRM,
            'data', NULL
        );
END;
$$ LANGUAGE plpgsql;
