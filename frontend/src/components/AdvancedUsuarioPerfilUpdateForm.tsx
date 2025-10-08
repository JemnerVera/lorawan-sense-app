import React, { useState, useMemo } from 'react';

interface AdvancedUsuarioPerfilUpdateFormProps {
  selectedRows: any[];
  onUpdate: (updatedEntries: any[]) => Promise<void>;
  onCancel: () => void;
  getUniqueOptionsForField: (columnName: string, filterParams?: { usuarioid?: string; perfilid?: string }) => Array<{value: any, label: string}>;
  userData: any[];
  perfilesData: any[];
}

export function AdvancedUsuarioPerfilUpdateForm({
  selectedRows,
  onUpdate,
  onCancel,
  getUniqueOptionsForField,
  userData,
  perfilesData
}: AdvancedUsuarioPerfilUpdateFormProps) {
  
  const getUsuarioFromSelectedRows = () => {
    if (selectedRows.length === 0) return null;
    
    
    // Obtener el primer usuarioid de las filas seleccionadas
    const firstUsuarioid = selectedRows[0]?.usuarioid;
    
    if (!firstUsuarioid) return null;
    
    // Buscar el usuario
    const usuario = userData.find(u => u.usuarioid === firstUsuarioid);
    return usuario;
  };
  
  const usuario = useMemo(() => getUsuarioFromSelectedRows(), [selectedRows]);
  const usuarioid = usuario?.usuarioid;
  
  // Estados para los perfiles seleccionados
  const [selectedPerfiles, setSelectedPerfiles] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Estados para búsqueda
  const [perfilesSearchTerm, setPerfilesSearchTerm] = useState('');

  // Función robusta para obtener perfiles únicos ACTIVOS de las filas seleccionadas
  const getUniquePerfilesFromRows = () => {
    const perfilesSet = new Set<number>();
    selectedRows.forEach(row => {
      // Si es una fila agrupada, buscar en originalRows
      if (row.originalRows && row.originalRows.length > 0) {
        row.originalRows.forEach((originalRow: any) => {
          if (originalRow.perfilid && originalRow.statusid === 1) {
            perfilesSet.add(originalRow.perfilid);
          }
        });
      } else {
        // Si es una fila individual, verificar directamente
        if (row.perfilid && row.statusid === 1) {
          perfilesSet.add(row.perfilid);
        }
      }
    });
    return Array.from(perfilesSet).map(perfilid => perfilid.toString());
  };

  // Obtener perfiles únicos de las filas seleccionadas
  const uniquePerfiles = useMemo(() => getUniquePerfilesFromRows(), [selectedRows]);

  // Inicializar perfiles seleccionados con los de las filas seleccionadas
  React.useEffect(() => {
    if (uniquePerfiles.length > 0) {
      setSelectedPerfiles(uniquePerfiles);
    }
  }, [uniquePerfiles]);

  // Obtener perfiles disponibles para el usuario
  const getPerfilesDisponibles = () => {
    return perfilesData.filter(perfil => perfil.statusid === 1);
  };

  // Filtrar perfiles por término de búsqueda
  const filteredPerfiles = getPerfilesDisponibles().filter(perfil =>
    perfil.perfil?.toLowerCase().includes(perfilesSearchTerm.toLowerCase()) ||
    perfil.descripcion?.toLowerCase().includes(perfilesSearchTerm.toLowerCase())
  );

  const handlePerfilToggle = (perfilId: string) => {
    setSelectedPerfiles(prev => 
      prev.includes(perfilId) 
        ? prev.filter(id => id !== perfilId)
        : [...prev, perfilId]
    );
  };

  const handleUpdate = async () => {
    setIsUpdating(true);
    
    try {
      // Crear entradas para actualizar - incluir tanto perfiles existentes como nuevos
      const updatedEntries: any[] = [];
      
      // Obtener todas las filas originales (expandir las agrupadas)
      const allOriginalRows = selectedRows.flatMap(row => 
        row.originalRows && row.originalRows.length > 0 ? row.originalRows : [row]
      );
      
      
      // 1. Actualizar perfiles existentes
      allOriginalRows.forEach(originalRow => {
        const perfilId = originalRow.perfilid;
        const isSelected = selectedPerfiles.includes(perfilId.toString());
        
        updatedEntries.push({
          usuarioid: originalRow.usuarioid,
          perfilid: originalRow.perfilid,
          statusid: isSelected ? 1 : 0, // 1 = activo, 0 = inactivo
          usercreatedid: originalRow.usercreatedid,
          datecreated: originalRow.datecreated,
          usermodifiedid: originalRow.usermodifiedid,
          datemodified: new Date().toISOString()
        });
      });
      
      // 2. Agregar nuevos perfiles seleccionados que no estaban en las filas originales
      const existingPerfilIds = allOriginalRows.map(row => row.perfilid.toString());
      const newPerfiles = selectedPerfiles.filter(perfilId => !existingPerfilIds.includes(perfilId));
      
      newPerfiles.forEach(perfilId => {
        updatedEntries.push({
          usuarioid: usuarioid,
          perfilid: parseInt(perfilId),
          statusid: 1, // Nuevo perfil = activo
          usercreatedid: null, // Se asignará en el backend
          datecreated: new Date().toISOString(),
          usermodifiedid: null, // Se asignará en el backend
          datemodified: new Date().toISOString()
        });
      });
      
      console.log('🔍 Debug - Entradas a enviar:', updatedEntries.map(entry => ({
        usuarioid: entry.usuarioid,
        perfilid: entry.perfilid,
        statusid: entry.statusid,
        isNew: !entry.usercreatedid ? 'NUEVA' : 'EXISTENTE'
      })));
      
      await onUpdate(updatedEntries);
    } catch (error) {
      console.error('❌ Error en handleUpdate:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-gray-100 dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg p-6">
      
      {/* Usuario (solo lectura) */}
      <div className="mb-4">
        <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">
          USUARIO
        </label>
        <div className="w-full px-3 py-2 bg-gray-200 dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 rounded text-gray-600 dark:text-neutral-400 font-mono">
          {usuario?.login || 'N/A'}
        </div>
      </div>

      {/* Container Perfiles */}
      <div className="bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-lg p-4 mb-6">
        <h4 className="text-lg font-bold text-orange-500 mb-4 font-mono tracking-wider">
          PERFILES
        </h4>
        
        {/* Búsqueda */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="🔍 Buscar perfiles..."
            value={perfilesSearchTerm}
            onChange={(e) => setPerfilesSearchTerm(e.target.value)}
            className="w-full px-3 py-2 bg-gray-100 dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 rounded text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
          />
        </div>
        
        <div className="max-h-60 overflow-y-auto space-y-2">
          {/* Perfiles de las filas seleccionadas */}
          {getUniquePerfilesFromRows().map((perfilId) => {
            const perfil = perfilesData.find(p => p.perfilid.toString() === perfilId);
            return (
              <label key={perfilId} className="flex items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-neutral-700 cursor-pointer transition-colors rounded">
                <input
                  type="checkbox"
                  checked={selectedPerfiles.includes(perfilId)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedPerfiles([...selectedPerfiles, perfilId]);
                    } else {
                      setSelectedPerfiles(selectedPerfiles.filter(id => id !== perfilId));
                    }
                  }}
                  className="w-4 h-4 text-orange-500 bg-gray-100 dark:bg-neutral-800 border-gray-300 dark:border-neutral-600 rounded focus:ring-orange-500 focus:ring-2 mr-3"
                />
                <span className="text-gray-900 dark:text-white text-sm font-mono tracking-wider">{perfil?.perfil?.toUpperCase() || perfilId}</span>
              </label>
            );
          })}
          
          {/* Perfiles adicionales disponibles */}
          {getPerfilesDisponibles()
            .filter(perfil => !getUniquePerfilesFromRows().includes(perfil.perfilid.toString()))
            .filter(perfil => 
              perfil.perfil?.toLowerCase().includes(perfilesSearchTerm.toLowerCase()) ||
              perfil.descripcion?.toLowerCase().includes(perfilesSearchTerm.toLowerCase())
            )
            .map((perfil) => (
              <label key={perfil.perfilid} className="flex items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-neutral-700 cursor-pointer transition-colors rounded">
                <input
                  type="checkbox"
                  checked={selectedPerfiles.includes(perfil.perfilid.toString())}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedPerfiles([...selectedPerfiles, perfil.perfilid.toString()]);
                    } else {
                      setSelectedPerfiles(selectedPerfiles.filter(id => id !== perfil.perfilid.toString()));
                    }
                  }}
                  className="w-4 h-4 text-orange-500 bg-gray-100 dark:bg-neutral-800 border-gray-300 dark:border-neutral-600 rounded focus:ring-orange-500 focus:ring-2 mr-3"
                />
                <span className="text-gray-900 dark:text-white text-sm font-mono tracking-wider">{perfil.perfil?.toUpperCase() || perfil.perfilid}</span>
              </label>
            ))}
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex justify-center gap-4">
        <button
          onClick={handleUpdate}
          disabled={isUpdating}
          className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-mono tracking-wider"
        >
          <span>➕</span>
          <span>{isUpdating ? 'GUARDANDO...' : 'GUARDAR'}</span>
        </button>
        <button
          onClick={onCancel}
          className="px-6 py-2 bg-gray-200 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-neutral-700 transition-colors font-medium flex items-center space-x-2 font-mono tracking-wider"
        >
          <span>❌</span>
          <span>CANCELAR</span>
        </button>
      </div>
    </div>
  );
}
