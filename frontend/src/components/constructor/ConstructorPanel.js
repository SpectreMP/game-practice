import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, { 
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  addEdge,
  MiniMap,
  Controls,
  Background
} from 'reactflow';
import 'reactflow/dist/style.css';

import { VariableNode, PrintNode, LoopNode, NumberNode } from './NodeTypes';
import CustomNode from './CustomNode';
import NodePalette from './NodePalette';

const nodeTypes = {
  customNode: CustomNode,
};

const ConstructorPanel = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  useEffect(() => {
    if (!reactFlowInstance) {
      const instance = reactFlowInstance || {};
      instance.project = ({ x, y }) => ({ x, y });
      setReactFlowInstance(instance);
    }
  }, [reactFlowInstance]);

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const onInit = useCallback(
    (rfi) => {
      if (!reactFlowInstance) {
        setReactFlowInstance(rfi);
      }
    },
    [reactFlowInstance]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
  
      if (!reactFlowInstance) {
        return;
      }
  
      const type = event.dataTransfer.getData('application/reactflow');
      const position = reactFlowInstance.project({
        x: event.clientX,
        y: event.clientY,
      });
  
      let newNode;
      switch (type) {
        case 'variable':
          newNode = new VariableNode(`${type}-${Date.now()}`, { value: 'x' });
          break;
        case 'number':
          newNode = new NumberNode(`${type}-${Date.now()}`, { value: 0 });
          break;
        case 'print':
          newNode = new PrintNode(`${type}-${Date.now()}`);
          break;
        case 'loop':
          newNode = new LoopNode(`${type}-${Date.now()}`, { count: 5 });
          break;
        default:
          return;
      }
  
      const reactFlowNode = {
        id: newNode.id,
        type: 'customNode',
        position,
        data: { 
          type: newNode.type,
          label: newNode.label,
          inputs: newNode.inputs,
          outputs: newNode.outputs,
          content: newNode.content
        },
      };
  
      setNodes((nds) => nds.concat(reactFlowNode));
    },
    [reactFlowInstance, setNodes]
  );

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <NodePalette />
      <ReactFlowProvider>
        <div style={{ flexGrow: 1, height: '100%' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={onInit}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
          >
            <Controls />
            <MiniMap />
            <Background />
          </ReactFlow>
        </div>
      </ReactFlowProvider>
    </div>
  );
};

export default ConstructorPanel;