import React from 'react';

const onDragStart = (event, nodeType) => {
  event.dataTransfer.setData('application/reactflow', nodeType);
  event.dataTransfer.effectAllowed = 'move';
};

const NodePalette = () => {
  const nodeTypes = ['variable', 'print', 'loop', 'number'];

  return (
    <div style={{ width: '150px', borderRight: '1px solid #ccc', padding: '10px' }}>
      <h3>Node Types</h3>
      {nodeTypes.map((type) => (
        <div
          key={type}
          onDragStart={(event) => onDragStart(event, type)}
          draggable
          style={{
            padding: '10px',
            margin: '5px',
            backgroundColor: '#4CAF50',
            color: 'white',
            borderRadius: '5px',
            cursor: 'move',
          }}
        >
          {type}
        </div>
      ))}
    </div>
  );
};

export default NodePalette;