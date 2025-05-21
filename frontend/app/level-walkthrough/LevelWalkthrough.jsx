import React, { useState, useEffect, useRef, useContext } from 'react';
import { ReactFlowProvider } from 'reactflow';
import { Link } from 'react-router';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { useEditor } from '../contexts/EditorContext';
import useNodeExecution from '../hooks/useNodeExecution';

// Проверяем, находимся ли мы в среде браузера
const isBrowser = typeof window !== 'undefined';

// Импорт провайдера контекста 3D сцены
import { Scene3DProvider } from '../contexts/Scene3DContext';

// Импорт компонентов
import FlowCanvas from '../node-editor/FlowCanvas';
import NodePalette from '../node-editor/NodePalette';
import NotificationPanel from '../node-editor/components/NotificationPanel';
import Console from '../node-editor/components/Console';
import { NODE_CATEGORIES } from '../services/nodeRegistry';
import SignalVisualizer from '../utils/SignalVisualizer';
import { ModelViewer } from '../model-viewer/ModelViewer';

// Импортируем функцию сброса состояния игрока
import { resetPlayerState } from '../utils/signalVisualizerConnector';

/**
 * Прохождение 3D-уровней с областью для 3D предпросмотра
 */
const LevelWalkthrough = () => {
    const [isMounted, setIsMounted] = useState(false);
    const {
        nodes,
        setNodes,
        edges,
        projectName,
        saveProject,
        loadProject,
        refreshProjectsList,
    } = useEditor();

    // Создаем ссылку на компонент SignalVisualizer
    const signalVisualizerRef = useRef(null);

    // Безопасное получение контекста 3D сцены (если доступен)
    // Используем безопасный подход
    let scene3dContext = null;
    try {
        // Для получения доступа к Scene3DContext в компоненте
        // Мы импортируем Scene3DProvider и оборачиваем весь компонент
        // Эта переменная будет использоваться для доступа к контексту внутри функций
        scene3dContext = useContext ? useContext(scene3dContext) : null;
    } catch (error) {
        console.log("3D сцена недоступна, продолжаем без неё");
    }

    // Состояние для выбранного быстрого сохранения
    const [selectedQuickSave, setSelectedQuickSave] = useState("");

    // Обработчик для предотвращения контекстного меню на логотипе
    const preventContextMenu = (e) => {
        e.preventDefault();
        return false;
    };

    // Функция для сброса состояния визуализатора в исходное состояние
    const resetVisualizerState = () => {
        // Пропускаем сброс на сервере
        if (!isBrowser) return;

        // Используем импортированную функцию для сброса позиции игрока
        const resetResult = resetPlayerState();
        console.log("Результат сброса через resetPlayerState:", resetResult);
        
        // Прямое обращение к компоненту через ref для сброса локального состояния
        if (signalVisualizerRef.current && typeof signalVisualizerRef.current.resetState === 'function') {
            signalVisualizerRef.current.resetState();
            console.log("Локальное состояние SignalVisualizer сброшено через ref");
        }
        
        // Сброс состояния в Scene3DContext
        if (scene3dContext && typeof scene3dContext.resetScene === 'function') {
            scene3dContext.resetScene();
            console.log("Состояние Scene3DContext сброшено");
        }
    };

    // Хук для выполнения алгоритма
    const {
        consoleOutput,
        stopExecution,
        executeStep,
        runFullAlgorithm,
    } = useNodeExecution(nodes, edges, setNodes, { resetVisualizerState });

    // Состояние для уведомлений
    const [notification, setNotification] = useState(null);

    // Состояние для симуляции
    const [isSimulationRunning, setIsSimulationRunning] = useState(false);
    
    // Состояние для отслеживания текущего шага симуляции
    const [simulationStep, setSimulationStep] = useState(0);
    
    // Интервал для плавной симуляции
    const simulationIntervalRef = useRef(null);

    // Флаг ожидания анимации
    const [isAnimationInProgress, setIsAnimationInProgress] = useState(false);

    // Состояние для списка быстрых сохранений
    const [quickSaves, setQuickSaves] = useState([]);

    // Устанавливаем флаг монтирования компонента и загружаем список быстрых сохранений
    useEffect(() => {
        setIsMounted(true);
        
        // Загружаем список быстрых сохранений из localStorage
        loadQuickSavesList();
        
        // Обновляем список проектов
        refreshProjectsList();
        
        // Очистка таймеров при размонтировании
        return () => {
            if (simulationIntervalRef.current) {
                clearTimeout(simulationIntervalRef.current);
            }
        };
    }, [refreshProjectsList]);

    // Функция для загрузки списка быстрых сохранений
    const loadQuickSavesList = () => {
        // Не выполняем на сервере
        if (!isBrowser) return;

        try {
            const saves = [];
            // В EditorContext проекты сохраняются с префиксом "nodeEditor_project_"
            const projectPrefix = "nodeEditor_project_";
            
            // Ищем в localStorage все ключи, начинающиеся с префикса
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(projectPrefix)) {
                    // Убираем префикс для отображения
                    saves.push(key.replace(projectPrefix, ''));
                }
            }
            console.log("Найдено сохранений:", saves.length, saves);
            setQuickSaves(saves);
            
            // Если список обновился, но выбранное сохранение больше не существует, сбрасываем выбор
            if (selectedQuickSave && !saves.includes(selectedQuickSave)) {
                setSelectedQuickSave("");
            }
        } catch (error) {
            console.error("Ошибка при загрузке списка быстрых сохранений:", error);
        }
    };

    // Функция для отображения уведомлений
    const showNotification = (message, type = "info") => {
        setNotification({ message, type });
    };

    // Обработчик закрытия уведомления
    const closeNotification = () => {
        setNotification(null);
    };

    // Обработчик для выполнения одного шага симуляции с анимацией
    const performSimulationStep = () => {
        // Прекращаем выполнение, если симуляция остановлена
        if (!isSimulationRunning) {
            return;
        }
        
        // Проверяем, идет ли сейчас анимация
        if (isAnimationInProgress) {
            // Если анимация в процессе, просто ждем её завершения и пробуем снова через 500ms
            simulationIntervalRef.current = setTimeout(performSimulationStep, 500);
            return;
        }

        // Устанавливаем флаг анимации
        setIsAnimationInProgress(true);
        
        // Выполняем шаг симуляции
        const result = executeStep();
        
        // Увеличиваем счетчик шагов
        setSimulationStep(prevStep => prevStep + 1);
        
        // Если есть результат и выполнение не завершено, планируем следующий шаг
        if (result && !result.isComplete) {
            // Задержка перед следующим шагом (больше времени для наблюдения за анимацией)
            const nextStepDelay = 1200; // 1.2 секунды
            
            // Сначала сбрасываем флаг анимации через 700 мс (после основной анимации)
            setTimeout(() => {
                setIsAnimationInProgress(false);
            }, 700);
            
            // Планируем следующий шаг через более длительный интервал
            simulationIntervalRef.current = setTimeout(performSimulationStep, nextStepDelay);
        } else {
            // Если выполнение завершено, останавливаем симуляцию
            setIsSimulationRunning(false);
            setIsAnimationInProgress(false);
            
            // Проверяем, был ли достигнут выход
            let exitReached = false;
            
            // Проверяем наличие сообщения о достижении выхода в консоли
            if (consoleOutput && consoleOutput.length > 0) {
                exitReached = consoleOutput.some(msg => 
                    msg.type === 'output' && 
                    (msg.value.includes('выход достигнут') || msg.value.includes('Выход достигнут'))
                );
            }
            
            if (!exitReached) {
                // Если выход не был достигнут, сбрасываем состояние визуализатора
                resetVisualizerState();
                showNotification("Симуляция завершена. Выход не был достигнут. Уровень сброшен.", "info");
            } else {
                showNotification("Симуляция завершена. Выход успешно достигнут!", "success");
            }
        }
    };

    // Следим за изменением состояния симуляции
    useEffect(() => {
        // Если симуляция запущена и нет активного интервала, начинаем выполнение
        if (isSimulationRunning && !simulationIntervalRef.current) {
            // Небольшая задержка перед началом для подготовки
            simulationIntervalRef.current = setTimeout(performSimulationStep, 500);
        } 
        // Если симуляция остановлена, но интервал существует, очищаем его
        else if (!isSimulationRunning && simulationIntervalRef.current) {
            clearTimeout(simulationIntervalRef.current);
            simulationIntervalRef.current = null;
        }
        
        // Очистка таймера при размонтировании
        return () => {
            if (simulationIntervalRef.current) {
                clearTimeout(simulationIntervalRef.current);
                simulationIntervalRef.current = null;
            }
        };
    }, [isSimulationRunning, isAnimationInProgress]);

    // Обработчик запуска симуляции
    const handleRunSimulation = () => {
        // Останавливаем текущую симуляцию, если она запущена
        if (isSimulationRunning) {
            handleStopSimulation();
            return;
        }
        
        // Сбрасываем счетчик шагов и устанавливаем начальное состояние
        setSimulationStep(0);
        
        // Сбрасываем состояние визуализатора перед началом симуляции
        resetVisualizerState();
        
        // executeStep() внутри сам подготовит выполнение при первом вызове
        
        // Запускаем симуляцию
        setIsSimulationRunning(true);
        showNotification("Начинаем плавную симуляцию...", "info");
    };

    // Обработчик остановки симуляции
    const handleStopSimulation = () => {
        // Останавливаем выполнение алгоритма
        stopExecution();
        
        // Сбрасываем состояние симуляции
        setIsSimulationRunning(false);
        setIsAnimationInProgress(false);
        
        // Очищаем таймер, если он существует
        if (simulationIntervalRef.current) {
            clearTimeout(simulationIntervalRef.current);
            simulationIntervalRef.current = null;
        }
        
        // Сбрасываем состояние визуализатора
        resetVisualizerState();
        
        showNotification("Симуляция остановлена", "info");
    };

    // Обработчик очистки консоли
    const handleClearConsole = () => {
        // Это будет обрабатываться внутри компонента Console
    };

    // Обработчик быстрого сохранения
    const handleQuickSave = () => {
        // Генерируем имя для быстрого сохранения
        const saveName = `debug_${new Date().toISOString().slice(0, 19).replace(/[-:T]/g, "_")}`;
        
        // Используем функцию сохранения из EditorContext
        const result = saveProject(saveName);
        
        if (result) {
            // Обновляем список быстрых сохранений
            loadQuickSavesList();
            // Показываем уведомление
            showNotification(`Быстрое сохранение создано: ${saveName}`, "success");
        } else {
            showNotification("Ошибка при создании быстрого сохранения", "error");
        }
    };

    // Обработчик быстрой загрузки
    const handleQuickLoad = () => {
        if (!selectedQuickSave) {
            showNotification("Выберите сохранение для загрузки", "warning");
            return;
        }
        
        // Останавливаем текущую симуляцию, если она запущена
        if (isSimulationRunning) {
            handleStopSimulation();
        }
        
        // Используем функцию загрузки из EditorContext
        const result = loadProject(selectedQuickSave);
        
        if (result) {
            // Сбрасываем состояние визуализатора
            resetVisualizerState();
            // Показываем уведомление
            showNotification(`Сохранение загружено: ${selectedQuickSave}`, "success");
        } else {
            showNotification("Ошибка при загрузке сохранения", "error");
        }
    };

    // Список разрешенных категорий нодов 
    const allowedCategories = [
        NODE_CATEGORIES.VARIABLES, NODE_CATEGORIES.CONTROL, NODE_CATEGORIES.OPERATIONS, NODE_CATEGORIES.SCENE_3D
    ];

    return (
        // Оборачиваем весь компонент в Scene3DProvider для доступа к 3D контексту
        <Scene3DProvider key="level-walkthrough-scene3d">
            <div className="w-full h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
                {/* Верхняя панель */}
                <nav className="bg-white dark:bg-gray-800 shadow-md border-b border-gray-200 dark:border-gray-700">
                    <div className="w-full px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-16">
                            <div className="flex items-center space-x-4">
                                {/* Логотип */}
                                <Link
                                    to="/"
                                    className="block relative"
                                    onContextMenu={preventContextMenu}
                                >
                                    <img
                                        src="/logo.png"
                                        alt="EduPlatform Logo"
                                        className="h-10 sm:h-12 w-auto select-none"
                                        style={{
                                            pointerEvents: 'none',
                                            userSelect: 'none',
                                            WebkitUserSelect: 'none'
                                        }}
                                        draggable="false"
                                    />
                                    {/* Защитный слой поверх изображения */}
                                    <div
                                        className="absolute inset-0 z-10"
                                        onContextMenu={preventContextMenu}
                                        onClick={(e) => e.stopPropagation()}
                                    ></div>
                                </Link>

                                {/* Вертикальный разделитель */}
                                <div className="h-8 w-px bg-gray-300 dark:bg-gray-600"></div>

                                {/* Заголовок */}
                                <h1 className="text-lg font-medium text-gray-800 dark:text-white">
                                    3D Редактор уровней {projectName ? `- ${projectName}` : ''}
                                </h1>
                            </div>

                            <div className="flex items-center space-x-2">
                                {/* Место для кнопок, если необходимо */}
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Уведомления */}
                <NotificationPanel
                    notification={notification}
                    onClose={closeNotification}
                    autoHideTime={3000}
                />

                {/* Основной контент - флекс-контейнер */}
                <div className="flex flex-1 h-[calc(100vh-4rem)]">
                    {isMounted && (
                        <ReactFlowProvider>
                            {/* Палитра нодов (левая панель) */}
                            <NodePalette
                                allowedCategories={allowedCategories}
                            />

                            {/* Центральная часть - нодовый редактор */}
                            <div className="flex-1 relative">
                                <FlowCanvas
                                    hideSidebar={true}
                                />
                            </div>

                            {/* Правая часть - 3D превью и консоль */}
                            <div className="w-164 border-l border-gray-200 dark:border-gray-700 flex flex-col">
                                {/* Используем скроллируемый контейнер для содержимого правой панели */}
                                <div className="flex-1 p-4 overflow-y-auto">
                                    {/* Заголовок боковой панели */}
                                    <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-4">3D Превью</h3>

                                    {/* Уменьшаем высоту визуализатора, чтобы он не занимал все пространство */}
                                    <div className="w-full h-96 rounded bg-gray-800 flex items-center justify-center mb-4">
                                        <ModelViewer />
                                    </div>

                                    {/* Консоль */}
                                    <div className="mb-4">
                                        <Console
                                            consoleOutput={consoleOutput}
                                            onClear={handleClearConsole}
                                            title="Консоль симуляции"
                                            initiallyExpanded={true}
                                        />
                                    </div>

                                    {/* Информация о симуляции */}
                                    {isSimulationRunning && (
                                        <div className="mt-2 mb-4 p-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                                            <p className="text-sm">Выполняется симуляция: шаг {simulationStep}</p>
                                        </div>
                                    )}

                                </div>

                                {/* Фиксированная нижняя часть без прокрутки */}
                                <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                                    {!isSimulationRunning ? (
                                        <button
                                            className="w-full p-2 bg-green-500 hover:bg-green-600 text-white rounded"
                                            onClick={handleRunSimulation}
                                        >
                                            Запустить симуляцию
                                        </button>
                                    ) : (
                                        <button
                                            className="w-full p-2 bg-red-500 hover:bg-red-600 text-white rounded"
                                            onClick={handleStopSimulation}
                                        >
                                            Остановить симуляцию
                                        </button>
                                    )}
                                </div>
                            </div>
                        </ReactFlowProvider>
                    )}
                </div>
            </div>
        </Scene3DProvider>
    );
};

export default LevelWalkthrough;
