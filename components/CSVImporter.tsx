import React, { useState } from 'react';
import { Role } from '../types';

interface CSVImporterProps {
  onImport: (data: any[], options: { importIds: boolean; replaceExisting: boolean }) => Promise<void>;
  fieldMappings: { [key: string]: string };
  sampleData?: string;
  userRole: Role;
}

const CSVImporter: React.FC<CSVImporterProps> = ({
  onImport,
  fieldMappings,
  sampleData,
  userRole,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [csvData, setCsvData] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mappings, setMappings] = useState<{ [key: string]: string }>({});
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [importing, setImporting] = useState(false);
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());
  const [importIds, setImportIds] = useState(false);
  const [replaceExisting, setReplaceExisting] = useState(false);

  // Only admins can import
  if (userRole !== Role.Admin && userRole !== Role.SuperAdmin) {
    return null;
  }

  const parseCSV = (text: string): { headers: string[]; rows: string[][] } => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(/[,;|\t]/).map(h => h.trim().replace(/^["']|["']$/g, ''));
    const rows = lines.slice(1).map(line => {
      const values = line.split(/[,;|\t]/).map(v => v.trim().replace(/^["']|["']$/g, ''));
      return values;
    });
    return { headers, rows };
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvData(text);
      
      try {
        const { headers: parsedHeaders, rows: parsedRows } = parseCSV(text);
        setHeaders(parsedHeaders);
        setRows(parsedRows);
        
        // Auto-suggest mappings
        const autoMappings: { [key: string]: string } = {};
        const allFields = new Set<string>();
        
        Object.keys(fieldMappings).forEach(field => {
          allFields.add(field);
          const normalizedField = field.toLowerCase().replace(/[_\s]/g, '');
          const matchedHeader = parsedHeaders.find(h => 
            h.toLowerCase().replace(/[_\s]/g, '') === normalizedField ||
            h.toLowerCase().includes(normalizedField) ||
            normalizedField.includes(h.toLowerCase())
          );
          if (matchedHeader) {
            autoMappings[field] = matchedHeader;
          }
        });
        
        setMappings(autoMappings);
        setSelectedFields(new Set(Object.keys(autoMappings)));
        setStep(2);
      } catch (error) {
        alert('Erro ao processar arquivo CSV. Verifique o formato.');
      }
    };
    reader.readAsText(file);
  };

  const handleMappingChange = (field: string, header: string) => {
    setMappings(prev => ({
      ...prev,
      [field]: header,
    }));
  };

  const toggleField = (field: string) => {
    setSelectedFields(prev => {
      const newSet = new Set(prev);
      if (newSet.has(field)) {
        newSet.delete(field);
      } else {
        newSet.add(field);
      }
      return newSet;
    });
  };

  const handlePreview = () => {
    setStep(3);
  };

  const handleConfirmImport = async () => {
    setImporting(true);
    try {
      const mappedData = rows.map(row => {
        const obj: any = {};
        Object.keys(mappings).forEach(field => {
          if (selectedFields.has(field)) {
            const headerIndex = headers.indexOf(mappings[field]);
            if (headerIndex !== -1) {
              let value = row[headerIndex];
              
              // Convert types
              if (field.toLowerCase().includes('price') || field.toLowerCase().includes('preco')) {
                value = value.replace(',', '.');
              }
              
              obj[field] = value;
            }
          }
        });
        return obj;
      });

      await onImport(mappedData, { importIds, replaceExisting });
      
      // Reset
      setIsOpen(false);
      setCsvData('');
      setHeaders([]);
      setRows([]);
      setMappings({});
      setStep(1);
      setSelectedFields(new Set());
      setImportIds(false);
      setReplaceExisting(false);
    } catch (error) {
      alert('Erro ao importar dados: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center bg-purple-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-600 transition-colors"
        title="Importar dados via CSV"
      >
        📥 Importar CSV
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-gray-800">
                  Importar Dados via CSV
                </h3>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setStep(1);
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              {/* Step Indicator */}
              <div className="flex items-center justify-between mb-8">
                <div className={`flex items-center ${step >= 1 ? 'text-emerald-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-emerald-600 text-white' : 'bg-gray-300'}`}>
                    1
                  </div>
                  <span className="ml-2 font-medium">Upload</span>
                </div>
                <div className="flex-1 h-1 mx-4 bg-gray-300">
                  <div className={`h-full ${step >= 2 ? 'bg-emerald-600' : 'bg-gray-300'}`} />
                </div>
                <div className={`flex items-center ${step >= 2 ? 'text-emerald-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-emerald-600 text-white' : 'bg-gray-300'}`}>
                    2
                  </div>
                  <span className="ml-2 font-medium">Mapeamento</span>
                </div>
                <div className="flex-1 h-1 mx-4 bg-gray-300">
                  <div className={`h-full ${step >= 3 ? 'bg-emerald-600' : 'bg-gray-300'}`} />
                </div>
                <div className={`flex items-center ${step >= 3 ? 'text-emerald-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-emerald-600 text-white' : 'bg-gray-300'}`}>
                    3
                  </div>
                  <span className="ml-2 font-medium">Confirmar</span>
                </div>
              </div>

              {/* Step 1: Upload */}
              {step === 1 && (
                <div>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <input
                      type="file"
                      accept=".csv,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="csv-upload"
                    />
                    <label
                      htmlFor="csv-upload"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <span className="text-6xl mb-4">📄</span>
                      <span className="text-lg font-medium text-gray-700 mb-2">
                        Clique para selecionar um arquivo CSV
                      </span>
                      <span className="text-sm text-gray-500">
                        Formatos aceitos: .csv, .txt (separado por vírgula, ponto-e-vírgula ou tab)
                      </span>
                    </label>
                  </div>

                  {sampleData && (
                    <div className="mt-6">
                      <h4 className="font-semibold text-gray-700 mb-2">Exemplo de CSV:</h4>
                      <pre className="bg-gray-50 p-4 rounded text-xs overflow-x-auto border border-gray-200">
                        {sampleData}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Mapping */}
              {step === 2 && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-4">
                    Mapeie as colunas do CSV para os campos do sistema:
                  </h4>
                  
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {Object.keys(fieldMappings).map(field => (
                      <div key={field} className="flex items-center gap-4 p-3 bg-gray-50 rounded">
                        <input
                          type="checkbox"
                          checked={selectedFields.has(field)}
                          onChange={() => toggleField(field)}
                          className="w-5 h-5"
                        />
                        <div className="flex-1 grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Campo no Sistema:
                            </label>
                            <div className="px-3 py-2 bg-white border border-gray-300 rounded">
                              {fieldMappings[field]}
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Coluna no CSV:
                            </label>
                            <select
                              value={mappings[field] || ''}
                              onChange={(e) => handleMappingChange(field, e.target.value)}
                              disabled={!selectedFields.has(field)}
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500"
                            >
                              <option value="">-- Não importar --</option>
                              {headers.map(header => (
                                <option key={header} value={header}>
                                  {header}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Opções de importação */}
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                    <h5 className="font-semibold text-blue-900 mb-2">⚙️ Opções de Importação:</h5>
                    
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={importIds}
                        onChange={(e) => setImportIds(e.target.checked)}
                        className="w-5 h-5 mt-0.5"
                      />
                      <div>
                        <div className="font-medium text-gray-900">✓ Importar IDs do CSV</div>
                        <div className="text-sm text-gray-600">
                          Usar os IDs do arquivo CSV ao invés de gerar automaticamente. IDs duplicados serão ignorados ou atualizados (veja opção abaixo).
                        </div>
                      </div>
                    </label>

                    <label className={`flex items-start gap-3 cursor-pointer ${!importIds ? 'opacity-50' : ''}`}>
                      <input
                        type="checkbox"
                        checked={replaceExisting}
                        onChange={(e) => setReplaceExisting(e.target.checked)}
                        disabled={!importIds}
                        className="w-5 h-5 mt-0.5"
                      />
                      <div>
                        <div className="font-medium text-gray-900">🔄 Substituir registros existentes</div>
                        <div className="text-sm text-gray-600">
                          {importIds 
                            ? "Se o ID já existir, atualizar os dados. Se não existir, criar novo registro." 
                            : "Esta opção só funciona com 'Importar IDs' ativado."}
                        </div>
                      </div>
                    </label>
                  </div>

                  <div className="mt-6 flex justify-between">
                    <button
                      onClick={() => setStep(1)}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                    >
                      ← Voltar
                    </button>
                    <button
                      onClick={handlePreview}
                      disabled={selectedFields.size === 0}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      Pré-visualizar →
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Preview */}
              {step === 3 && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-4">
                    Pré-visualização dos dados a serem importados:
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    {rows.length} registro(s) serão importados. Verifique os dados antes de confirmar.
                  </p>

                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-gray-100">
                          {Array.from(selectedFields).map(field => (
                            <th key={field} className="px-3 py-2 text-left border border-gray-300">
                              {fieldMappings[field]}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.slice(0, 10).map((row, rowIndex) => (
                          <tr key={rowIndex} className="hover:bg-gray-50">
                            {Array.from(selectedFields).map(field => {
                              const headerIndex = headers.indexOf(mappings[field]);
                              const value = headerIndex !== -1 ? row[headerIndex] : '';
                              return (
                                <td key={field} className="px-3 py-2 border border-gray-300">
                                  {value}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {rows.length > 10 && (
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        Mostrando 10 de {rows.length} registros
                      </p>
                    )}
                  </div>

                  <div className="mt-6 flex justify-between">
                    <button
                      onClick={() => setStep(2)}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                    >
                      ← Voltar
                    </button>
                    <button
                      onClick={handleConfirmImport}
                      disabled={importing}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {importing ? 'Importando...' : `✓ Confirmar Importação (${rows.length} registros)`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CSVImporter;
