import React, { useState, useEffect } from 'react';
import { JoySenseService } from '../../services/backend-api';
import SeparateCharts from './SeparateCharts';

interface DynamicHierarchyProps {
  selectedPais?: any;
  selectedEmpresa?: any;
  selectedFundo?: any;
  selectedEntidad?: any;
  selectedUbicacion?: any;
  startDate?: string;
  endDate?: string;
  onFundoChange?: (fundo: any) => void;
  onEntidadChange?: (entidad: any) => void;
  onUbicacionChange?: (ubicacion: any) => void;
  onDateFilter?: (start: string, end: string) => void;
  onResetFilters?: () => void;
}

const DynamicHierarchy: React.FC<DynamicHierarchyProps> = ({ 
  selectedPais,
  selectedEmpresa,
  selectedFundo,
  selectedEntidad,
  selectedUbicacion,
  startDate,
  endDate,
  onFundoChange,
  onEntidadChange,
  onUbicacionChange,
  onDateFilter,
  onResetFilters
}) => {
  const [mediciones, setMediciones] = useState<any[]>([]);
  const [metricas, setMetricas] = useState<any[]>([]);
  const [tipos, setTipos] = useState<any[]>([]);
  const [selectedMetrica, setSelectedMetrica] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos iniciales (métricas y tipos)
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [metricasData, tiposData] = await Promise.all([
          JoySenseService.getMetricas(),
          JoySenseService.getTipos()
        ]);

        setMetricas(Array.isArray(metricasData) ? metricasData : []);
        setTipos(Array.isArray(tiposData) ? tiposData : []);
        
        // Seleccionar la primera métrica por defecto
        if (Array.isArray(metricasData) && metricasData.length > 0) {
          setSelectedMetrica(metricasData[0].metricaid);
        }
      } catch (err) {
        console.error('❌ Error cargando datos iniciales:', err);
      }
    };

    loadInitialData();
  }, []);

  // Cargar mediciones cuando cambien los filtros
  useEffect(() => {
    const loadMediciones = async () => {
      if (!selectedEntidad?.entidadid || !selectedUbicacion?.ubicacionid || !startDate || !endDate) {
        setMediciones([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log('🔍 DynamicHierarchy: Cargando mediciones con filtros:', {
          entidadId: selectedEntidad.entidadid,
          ubicacionId: selectedUbicacion.ubicacionid,
          startDate,
          endDate
        });

        const data = await JoySenseService.getMediciones({
          entidadId: selectedEntidad.entidadid,
          ubicacionId: selectedUbicacion.ubicacionid,
          startDate,
          endDate
        });

        console.log('🔍 DynamicHierarchy: Mediciones obtenidas:', Array.isArray(data) ? data.length : 0);
        setMediciones(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('❌ Error cargando mediciones:', err);
        setError('Error al cargar las mediciones');
      } finally {
        setLoading(false);
      }
    };

    loadMediciones();
  }, [selectedEntidad, selectedUbicacion, startDate, endDate]);

  // Mostrar loading
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-400">Cargando datos del dashboard...</p>
        </div>
      </div>
    );
  }

  // Mostrar error
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 text-lg font-semibold mb-2">Error</div>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  // Función para determinar qué filtro falta
  const getMissingFilterMessage = () => {
    if (!selectedEntidad) return 'Selecciona Entidad';
    if (!selectedUbicacion) return 'Selecciona Ubicación';
    if (!startDate || !endDate) return 'Selecciona Fechas';
    return '';
  };

  // Mostrar mensaje si no hay filtros seleccionados
  if (!selectedEntidad || !selectedUbicacion || !startDate || !endDate) {
    const missingFilter = getMissingFilterMessage();
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="bg-red-500 bg-opacity-20 border border-red-500 border-opacity-30 rounded-lg p-6 max-w-md">
            <h3 className="text-xl font-semibold text-white mb-2">{missingFilter}</h3>
            <p className="text-gray-300 text-sm">Usa los filtros del header para continuar</p>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar mensaje si no hay datos
  if (mediciones.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-white mb-2">No hay datos disponibles</h3>
          <p className="text-gray-400">No se encontraron mediciones para los filtros seleccionados</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Botones de Métricas */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex flex-wrap gap-2 justify-center">
          {metricas
            .filter(metrica => {
              // Solo mostrar métricas que tienen datos en las mediciones actuales
              return mediciones.some(m => m.metricaid === metrica.metricaid);
            })
            .map((metrica) => (
            <button
              key={metrica.metricaid}
              onClick={() => setSelectedMetrica(metrica.metricaid)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedMetrica === metrica.metricaid
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
            >
              {metrica.metrica}
            </button>
          ))}
        </div>
      </div>

      {/* Gráficos */}
      <div className="bg-gray-800 rounded-lg p-6">
        <SeparateCharts
          mediciones={mediciones}
          loading={loading}
          selectedMetrica={selectedMetrica}
          metricas={metricas}
          tipos={tipos}
          startDate={startDate}
          endDate={endDate}
        />
      </div>
    </div>
  );
};

export default DynamicHierarchy;