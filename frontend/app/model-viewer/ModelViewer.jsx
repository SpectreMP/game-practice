import { useEffect, useRef, useState } from 'react'
import * as BABYLON from '@babylonjs/core'
import * as MATERIALS from '@babylonjs/materials'
import { registerBuiltInLoaders } from '@babylonjs/loaders/dynamic'
import { TransformControls } from './TransformControls.jsx'
import { ModelsList } from './ModelsList.jsx'

// Регистрируем загрузчики моделей BabylonJS
registerBuiltInLoaders()

export function ModelViewer() {
  const canvasRef = useRef(null)
  const engineRef = useRef(null)
  const sceneRef = useRef(null)
  const highlightLayerRef = useRef(null)
  const [dragActive, setDragActive] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [models, setModels] = useState([])
  const [selectedModelId, setSelectedModelId] = useState(null)
  const [modelFiles, setModelFiles] = useState({}) // Хранилище для бинарных данных моделей
  
  // Генерация уникального ID
  const generateId = () => `model-${Date.now()}-${Math.floor(Math.random() * 1000)}`

  // Инициализация сцены BabylonJS
  useEffect(() => {
    if (!canvasRef.current) return

    // Создаем движок и сцену
    const engine = new BABYLON.Engine(canvasRef.current, true)
    engineRef.current = engine
    
    const createScene = () => {
      const scene = new BABYLON.Scene(engine)
      
      // Настройка камеры
      const camera = new BABYLON.ArcRotateCamera(
        'camera', 
        -Math.PI / 2, 
        Math.PI / 2.5, 
        10, 
        new BABYLON.Vector3(0, 0, 0), 
        scene
      )
      camera.lowerRadiusLimit = 1;
      camera.upperRadiusLimit = 300;
      camera.attachControl(canvasRef.current, true)
      camera.wheelDeltaPercentage = 0.01
      
      // Добавляем освещение
      const light1 = new BABYLON.HemisphericLight(
        'light1', 
        new BABYLON.Vector3(1, 1, 0), 
        scene
      )
      light1.intensity = 0.7
      
      const light2 = new BABYLON.DirectionalLight(
        'light2', 
        new BABYLON.Vector3(-1, -1, -1), 
        scene
      )
      light2.intensity = 0.5
      
      // Создаем сетку для пола
      const ground = BABYLON.MeshBuilder.CreateGround(
        'ground', 
        { width: 100, height: 100 }, 
        scene
      )
      const groundMaterial = new MATERIALS.GridMaterial('groundMaterial', scene)
      groundMaterial.majorUnitFrequency = 5
      groundMaterial.minorUnitVisibility = 0.45
      groundMaterial.gridRatio = 1
      groundMaterial.mainColor = new BABYLON.Color3(0.6, 0.6, 0.6)
      groundMaterial.lineColor = new BABYLON.Color3(0.8, 0.8, 0.8)
      groundMaterial.opacity = 0.98
      ground.material = groundMaterial



      const skybox = BABYLON.MeshBuilder.CreateBox("skybox", { size: 5000 }, scene);
      const skyboxMaterial = new BABYLON.StandardMaterial("skyboxMaterial", scene);
      skyboxMaterial.backFaceCulling = false;
    
      skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
      skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
      skyboxMaterial.emissiveColor = new BABYLON.Color3(0.2, 0.5, 0.8);
    
      skybox.material = skyboxMaterial;
      
      // Создаем слой подсветки для выделения выбранных моделей
      const highlightLayer = new BABYLON.HighlightLayer("highlightLayer", scene)
      highlightLayer.innerGlow = true
      highlightLayer.outerGlow = true
      highlightLayerRef.current = highlightLayer
      
      // Добавляем обработчик клика для выбора модели
      scene.onPointerDown = (evt, pickResult) => {
        if (pickResult.hit && pickResult.pickedMesh) {
          const modelId = pickResult.pickedMesh.metadata?.modelId;
          if (modelId && modelId !== 'ground') {
            setSelectedModelId(modelId);
          } else {
            setSelectedModelId(null);
          }
        } else {
          setSelectedModelId(null);
        }
      };
      
      return scene
    }
    
    const scene = createScene()
    sceneRef.current = scene
    
    // Запускаем рендеринг
    engine.runRenderLoop(() => {
      scene.render()
    })
    
    // Обработка изменения размера окна
    const resizeHandler = () => {
      engine.resize()
    }
    window.addEventListener('resize', resizeHandler)
    
    return () => {
      window.removeEventListener('resize', resizeHandler)
      engine.dispose()
    }
  }, [])

  // Выделение выбранной модели
  useEffect(() => {
    if (!sceneRef.current || !highlightLayerRef.current) return;
    
    // Очищаем текущие выделения
    highlightLayerRef.current.removeAllMeshes();
    
    if (selectedModelId) {
      // Ищем все меши, принадлежащие выбранной модели
      sceneRef.current.meshes.forEach(mesh => {
        if (mesh.metadata?.modelId === selectedModelId) {
          // Добавляем меш в слой подсветки с голубым цветом
          highlightLayerRef.current.addMesh(mesh, BABYLON.Color3.FromHexString("#00a0ff"));
        }
      });
    }
  }, [selectedModelId]);

  // Обновление трансформаций модели в сцене
  useEffect(() => {
    if (!sceneRef.current) return;
    
    models.forEach(model => {
      const rootMesh = sceneRef.current.getMeshById(model.rootMeshId);
      if (rootMesh) {
        // Обновляем трансформации модели
        rootMesh.position = new BABYLON.Vector3(
          model.transform.position.x,
          model.transform.position.y,
          model.transform.position.z
        );
        
        // Преобразуем градусы в радианы для вращения
        rootMesh.rotation = new BABYLON.Vector3(
          model.transform.rotation.x * (Math.PI / 180),
          model.transform.rotation.y * (Math.PI / 180),
          model.transform.rotation.z * (Math.PI / 180)
        );
        
        rootMesh.scaling = new BABYLON.Vector3(
          model.transform.scaling.x,
          model.transform.scaling.y,
          model.transform.scaling.z
        );
      }
    });
  }, [models]);

  // Сохранение бинарных данных модели
  const saveModelFile = (modelId, fileData, fileName) => {
    setModelFiles(prev => ({
      ...prev,
      [modelId]: {
        data: fileData,
        name: fileName
      }
    }));
  };

  // Загрузка модели .glb
  const loadModel = async (file) => {
    try {
      setErrorMessage('')
      if (!sceneRef.current) return

      // Создаем FileReader для чтения файла как ArrayBuffer
      const reader = new FileReader()
      
      reader.onload = async (event) => {
        try {
          if (!event.target?.result) {
            throw new Error("Не удалось прочитать файл")
          }
          
          // Преобразуем ArrayBuffer в массив uint8
          const content = new Uint8Array(event.target.result)
          const fileName = file.name
          
          // Генерируем уникальный ID для модели
          const modelId = generateId()
          
          // Сохраняем бинарные данные модели
          saveModelFile(modelId, content, fileName)
          
          // Используем встроенный метод для создания файла с правильным именем
          const engineBinaryFile = new File([content], fileName, { type: "application/octet-stream" })
          
          // Загружаем модель из файла
          const result = await BABYLON.SceneLoader.ImportMeshAsync(
            "",             // имена мешей (пустая строка = все меши) 
            "file:",        // rootUrl
            engineBinaryFile, // файл
            sceneRef.current // сцена
          )
          
          // Если модель загрузилась успешно
          if (result.meshes.length > 0) {
            // Создаем корневой меш, который будет содержать все меши модели
            const rootMesh = new BABYLON.Mesh(`root-${modelId}`, sceneRef.current)
            rootMesh.id = `root-${modelId}`
            
            // Добавляем метаданные к мешу для идентификации
            rootMesh.metadata = { modelId }
            
            // Вычисляем центр модели
            let minX = Number.MAX_VALUE, minY = Number.MAX_VALUE, minZ = Number.MAX_VALUE
            let maxX = Number.MIN_VALUE, maxY = Number.MIN_VALUE, maxZ = Number.MIN_VALUE
            
            result.meshes.forEach(mesh => {
              if (mesh !== rootMesh) {
                const boundingBox = mesh.getBoundingInfo().boundingBox
                minX = Math.min(minX, boundingBox.minimum.x)
                minY = Math.min(minY, boundingBox.minimum.y)
                minZ = Math.min(minZ, boundingBox.minimum.z)
                maxX = Math.max(maxX, boundingBox.maximum.x)
                maxY = Math.max(maxY, boundingBox.maximum.y)
                maxZ = Math.max(maxZ, boundingBox.maximum.z)
                
                // Добавляем метаданные для поддержки выбора
                mesh.metadata = { modelId }
                
                // Родительским элементом становится rootMesh, а не сцена
                mesh.parent = rootMesh
              }
            })
            
            // Вычисляем размер модели
            const modelWidth = maxX - minX
            const modelHeight = maxY - minY
            const modelDepth = maxZ - minZ
            
            // Определяем масштаб для нормализации размера модели
            const maxDimension = Math.max(modelWidth, modelHeight, modelDepth)
            const scale = maxDimension > 0 ? 2 / maxDimension : 1
            
            // Создаем модель для сохранения в состоянии
            const newModel = {
              id: modelId,
              fileName: fileName,
              rootMeshId: rootMesh.id,
              transform: {
                position: { x: 0, y: 0, z: 0 },
                rotation: { x: 0, y: 0, z: 0 },
                scaling: { x: scale, y: scale, z: scale }
              }
            }
            
            // Применяем начальные трансформации
            rootMesh.scaling = new BABYLON.Vector3(scale, scale, scale)
            
            // Добавляем новую модель в список
            setModels(prevModels => [...prevModels, newModel])
            setSelectedModelId(modelId)
            
            // Если это первая модель, центрируем камеру
            if (models.length === 0) {
              const camera = sceneRef.current.cameras[0]
              if (camera instanceof BABYLON.ArcRotateCamera) {
                camera.target = new BABYLON.Vector3(0, 0, 0)
                camera.radius = 5
              }
            }
          }
        } catch (error) {
          console.error("Error loading model:", error)
          setErrorMessage('Ошибка загрузки модели. Убедитесь, что это корректный GLB файл.')
        }
      }
      
      reader.onerror = () => {
        setErrorMessage('Ошибка чтения файла.')
      }
      
      // Читаем файл как ArrayBuffer
      reader.readAsArrayBuffer(file)
    } catch (error) {
      console.error("Fatal error:", error)
      setErrorMessage('Произошла непредвиденная ошибка.')
    }
  }

  // Обработка изменений параметров модели
  const handleModelChange = (modelId, action, value) => {
    if (action === 'delete') {
      // Удаляем модель из сцены
      const modelToDelete = models.find(m => m.id === modelId);
      if (modelToDelete && sceneRef.current) {
        const rootMesh = sceneRef.current.getMeshById(modelToDelete.rootMeshId);
        if (rootMesh) {
          rootMesh.dispose(false, true);
        }
      }
      
      // Удаляем модель из состояния и хранилища бинарных данных
      setModels(prevModels => prevModels.filter(m => m.id !== modelId));
      setModelFiles(prev => {
        const newModelFiles = {...prev};
        delete newModelFiles[modelId];
        return newModelFiles;
      });
      
      if (selectedModelId === modelId) {
        setSelectedModelId(null);
      }
    } else if (action === 'transform') {
      // Обновляем трансформации модели
      setModels(prevModels => 
        prevModels.map(model => 
          model.id === modelId 
            ? { ...model, transform: value } 
            : model
        )
      );
    }
  };

  // Обработчики событий перетаскивания
  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // Обрабатываем все перетащенные файлы
      Array.from(e.dataTransfer.files).forEach(file => {
        if (file.name.toLowerCase().endsWith('.glb')) {
          loadModel(file)
        } else {
          setErrorMessage('Поддерживаются только файлы формата .glb')
        }
      });
    }
  }

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      // Обрабатываем все выбранные файлы
      Array.from(e.target.files).forEach(file => {
        if (file.name.toLowerCase().endsWith('.glb')) {
          loadModel(file)
        } else {
          setErrorMessage('Поддерживаются только файлы формата .glb')
        }
      });
    }
  }
  
  // ======== Сериализация/десериализация ========
  
  // Функция сериализации сцены в JSON
  const serializeScene = () => {
    try {
      if (models.length === 0) {
        setErrorMessage('Нет моделей для экспорта');
        return;
      }
      
      // Подготавливаем данные для сериализации
      const serializedData = {
        timestamp: Date.now(),
        models: models.map(model => {
          // Преобразуем Uint8Array в base64 для хранения бинарных данных
          const modelFile = modelFiles[model.id];
          const base64Data = arrayBufferToBase64(modelFile.data);
          
          return {
            id: model.id,
            fileName: model.fileName,
            fileData: base64Data,
            transform: model.transform
          };
        })
      };
      
      // Создаем JSON строку
      const jsonData = JSON.stringify(serializedData, null, 2);
      
      // Создаем и загружаем файл
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `scene-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error serializing scene:", error);
      setErrorMessage('Ошибка при экспорте сцены');
    }
  };
  
  // Преобразование ArrayBuffer в base64
  const arrayBufferToBase64 = (buffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };
  
  // Преобразование base64 в ArrayBuffer
  const base64ToArrayBuffer = (base64) => {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };
  
  // Функция загрузки сохраненной сцены
  const deserializeScene = (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const jsonData = JSON.parse(event.target.result);
          
          // Очищаем текущую сцену
          clearScene();
          
          // Загружаем модели одну за другой
          for (const modelData of jsonData.models) {
            await loadModelFromSerialized(modelData);
          }
          
        } catch (error) {
          console.error("Error parsing scene file:", error);
          setErrorMessage('Ошибка парсинга файла сцены');
        }
      };
      reader.onerror = () => {
        setErrorMessage('Ошибка чтения файла сцены');
      };
      reader.readAsText(file);
    } catch (error) {
      console.error("Error deserializing scene:", error);
      setErrorMessage('Ошибка при импорте сцены');
    }
  };
  
  // Очистка сцены перед загрузкой новой
  const clearScene = () => {
    // Удаляем все существующие модели из сцены
    if (sceneRef.current) {
      models.forEach(model => {
        const rootMesh = sceneRef.current.getMeshById(model.rootMeshId);
        if (rootMesh) {
          rootMesh.dispose(false, true);
        }
      });
    }
    
    // Очищаем состояние
    setModels([]);
    setModelFiles({});
    setSelectedModelId(null);
  };
  
  // Загрузка модели из сериализованных данных
  const loadModelFromSerialized = async (modelData) => {
    try {
      if (modelData.id.startsWith("map")){
          let rootMesh = BABYLON.MeshBuilder.CreateBox(modelData.id, { size: 1 }, sceneRef.current);
          const cubeMaterial = new BABYLON.StandardMaterial("cubeMaterial", sceneRef.current);
          switch (modelData.type){
            case 'cube':
                cubeMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.8);
                rootMesh.material = cubeMaterial;
                rootMesh.position = new BABYLON.Vector3(modelData.transform.position.x, modelData.transform.position.y, modelData.transform.position.z);
                rootMesh.rotation = new BABYLON.Vector3(modelData.transform.rotation.x, modelData.transform.rotation.y, modelData.transform.rotation.z);
                rootMesh.scaling = new BABYLON.Vector3(modelData.transform.scaling.x, modelData.transform.scaling.y, modelData.transform.scaling.z);
                break;
            case 'player':
                cubeMaterial.diffuseColor = new BABYLON.Color3(0, 1, 0);
                rootMesh.visibility = 0.7;
                rootMesh.material = cubeMaterial;
                rootMesh.position = new BABYLON.Vector3(modelData.transform.position.x, modelData.transform.position.y, modelData.transform.position.z);
                rootMesh.rotation = new BABYLON.Vector3(modelData.transform.rotation.x, modelData.transform.rotation.y, modelData.transform.rotation.z);
                rootMesh.scaling = new BABYLON.Vector3(modelData.transform.scaling.x, modelData.transform.scaling.y, modelData.transform.scaling.z);
                break;
            case 'exit':
                cubeMaterial.diffuseColor = new BABYLON.Color3(1, 0, 0);
                rootMesh.visibility = 0.7;
                rootMesh.material = cubeMaterial;
                rootMesh.position = new BABYLON.Vector3(modelData.transform.position.x, modelData.transform.position.y, modelData.transform.position.z);
                rootMesh.rotation = new BABYLON.Vector3(modelData.transform.rotation.x, modelData.transform.rotation.y, modelData.transform.rotation.z);
                rootMesh.scaling = new BABYLON.Vector3(modelData.transform.scaling.x, modelData.transform.scaling.y, modelData.transform.scaling.z);
                break;
            default:
                rootMesh.visibility = 0;
          }
          
          const newModel = {
            id: modelData.id,
            type: modelData.type,
            metadata: modelData.metadata,
            rootMeshId: rootMesh.id,
            transform: modelData.transform
          };

          setModels(prevModels => [...prevModels, newModel]);
          return;
      }
      
      // Восстанавливаем бинарные данные из base64
      const binaryData = base64ToArrayBuffer(modelData.fileData);
      
      // Создаем файл для загрузки в BabylonJS
      const file = new File([binaryData], modelData.fileName, { type: "application/octet-stream" });
      
      // Сохраняем исходный ID модели
      const originalId = modelData.id;
      
      // Загружаем модель через стандартную функцию
      const reader = new FileReader();
      
      return new Promise((resolve, reject) => {
        reader.onload = async (event) => {
          try {
            if (!event.target?.result) {
              throw new Error("Не удалось прочитать файл");
            }
            
            // Получаем содержимое файла
            const content = new Uint8Array(event.target.result);
            
            // Используем оригинальный ID вместо генерации нового
            const modelId = originalId;
            
            // Сохраняем бинарные данные модели
            saveModelFile(modelId, content, modelData.fileName);
            
            // Создаем файл для BabylonJS
            const engineBinaryFile = new File(
              [content],
              modelData.fileName,
              { type: "application/octet-stream" }
            );
            
            // Загружаем модель в сцену
            const result = await BABYLON.SceneLoader.ImportMeshAsync(
              "",
              "file:",
              engineBinaryFile,
              sceneRef.current
            );
            
            // Если модель загрузилась успешно
            if (result.meshes.length > 0) {
              // Создаем корневой меш с оригинальным ID
              const rootMesh = new BABYLON.Mesh(`root-${modelId}`, sceneRef.current);
              rootMesh.id = `root-${modelId}`;
              
              // Добавляем метаданные
              rootMesh.metadata = { modelId };
              
              // Настраиваем иерархию мешей
              result.meshes.forEach(mesh => {
                if (mesh !== rootMesh) {
                  mesh.metadata = { modelId };
                  mesh.parent = rootMesh;
                }
              });
              
              // Создаем объект модели с оригинальными трансформациями
              const newModel = {
                id: modelId,
                fileName: modelData.fileName,
                rootMeshId: rootMesh.id,
                transform: modelData.transform
              };
              
              // Применяем трансформации
              rootMesh.position = new BABYLON.Vector3(
                modelData.transform.position.x,
                modelData.transform.position.y,
                modelData.transform.position.z
              );
              
              rootMesh.rotation = new BABYLON.Vector3(
                modelData.transform.rotation.x * (Math.PI / 180),
                modelData.transform.rotation.y * (Math.PI / 180),
                modelData.transform.rotation.z * (Math.PI / 180)
              );
              
              rootMesh.scaling = new BABYLON.Vector3(
                modelData.transform.scaling.x,
                modelData.transform.scaling.y,
                modelData.transform.scaling.z
              );
              
              // Добавляем модель в список
              setModels(prevModels => [...prevModels, newModel]);
              
              resolve();
            } else {
              reject(new Error("Не удалось загрузить модель"));
            }
          } catch (error) {
            console.error("Error loading serialized model:", error);
            reject(error);
          }
        };
        
        reader.onerror = () => {
          reject(new Error("Ошибка чтения файла модели"));
        };
        
        reader.readAsArrayBuffer(file);
      });
    } catch (error) {
      console.error("Error in loadModelFromSerialized:", error);
      setErrorMessage('Ошибка загрузки сериализованной модели');
    }
  };

  return (
    <div className="flex flex-col items-center h-full">
      <div 
        className={`relative w-full h-full ${dragActive ? 'border-4 border-blue-500 bg-blue-50': null}`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full"
        />
        {models.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="text-lg font-medium text-gray-200">
              Перетащите .glb файлы сюда
            </div>
            <div className="text-sm text-gray-400 mt-2">
              или
            </div>
            <label className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md cursor-pointer pointer-events-auto">
              Выбрать файлы
              <input 
                type="file" 
                accept=".glb" 
                className="hidden" 
                onChange={handleFileSelect}
                multiple
              />
            </label>
          </div>
        )}
        
        {errorMessage && (
          <div className="absolute bottom-2 left-0 right-0 mx-auto text-center text-red-500 bg-red-50 p-2 rounded max-w-md">
            {errorMessage}
          </div>
        )}
      </div>
      
        {models.length > 0 && (
          <div className="flex gap-2">
            <button 
              onClick={serializeScene}
              className="fixed bottom-16 left-4 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md"
            >
              Экспортировать сцену
            </button>
          </div>
        )}
        
        <div>
          <label className="fixed bottom-4 left-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md cursor-pointer">
            Импортировать сцену
            <input 
              type="file" 
              accept=".json" 
              className="hidden" 
              onChange={deserializeScene}
            />
          </label>
        </div>
      
      {models.length > 0 && (
        <div className="w-full">
          <ModelsList 
            models={models}
            selectedModelId={selectedModelId}
            onSelectModel={setSelectedModelId}
            onModelChange={handleModelChange}
            onFileSelect={handleFileSelect}
          />
        </div>
      )}
      
      {selectedModelId && (
        <div className="w-full">
          <TransformControls 
            model={models.find(m => m.id === selectedModelId)} 
            onChange={handleModelChange} 
          />
        </div>
      )}
    </div>
  )
}
