import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Box, Typography } from '@mui/material';
import nodeStyles from './nodeStyles';

const CustomNode = ({ data }) => {
  return (
    <Box sx={{
      ...nodeStyles.node,
      ...(nodeStyles[`${data.type}Node`] || {}),
    }}>
      <Typography sx={nodeStyles.nodeHeader}>{data.label}</Typography>
      <Box sx={nodeStyles.nodeContent}>{data.content}</Box>
      {data.inputs.map((input, index) => (
        <Handle
          key={`input-${index}`}
          type="target"
          position={Position.Left}
          id={input.name}
          style={{ top: `${(index + 1) * 25}%` }}
        />
      ))}
      {data.outputs.map((output, index) => (
        <Handle
          key={`output-${index}`}
          type="source"
          position={Position.Right}
          id={output.name}
          style={{ top: `${(index + 1) * 25}%` }}
        />
      ))}
    </Box>
  );
};

export default memo(CustomNode);