import React from 'react';
import { TextField } from '@mui/material';
import nodeStyles from './nodeStyles';

class BaseNode {
  constructor(id, type, label) {
    this.id = id;
    this.type = type;
    this.label = label;
    this.inputs = [];
    this.outputs = [];
  }
}

export class VariableNode extends BaseNode {
  constructor(id, data) {
    super(id, 'variable', 'Variable');
    this.inputs.push({ name: 'value', label: 'Value' });
    this.outputs.push({ name: 'value', label: 'Value' });
    this.content = (
      <TextField 
        defaultValue={data.value} 
        onChange={(e) => this.value = e.target.value}
        variant="outlined"
        size="small"
        fullWidth
        sx={nodeStyles.input}
      />
    );
  }
}

export class NumberNode extends BaseNode {
  constructor(id, data) {
    super(id, 'number', 'Number');
    this.inputs.push({ name: 'value', label: 'Value' });
    this.outputs.push({ name: 'value', label: 'Value' });
    this.content = (
      <TextField 
        type="number" 
        defaultValue={data.value} 
        onChange={(e) => this.value = parseFloat(e.target.value)}
        variant="outlined"
        size="small"
        fullWidth
        sx={nodeStyles.input}
      />
    );
  }
}

export class PrintNode extends BaseNode {
  constructor(id) {
    super(id, 'print', 'Print');
    this.inputs.push({ name: 'value', label: 'Value' });
    this.outputs.push({ name: 'next', label: 'Next' });
  }
}

export class LoopNode extends BaseNode {
  constructor(id, data) {
    super(id, 'loop', 'Loop');
    this.inputs.push({ name: 'count', label: 'Count' });
    this.outputs.push({ name: 'body', label: 'Body' });
    this.outputs.push({ name: 'next', label: 'Next' });
    this.content = (
      <TextField 
        type="number" 
        label="Repeat"
        defaultValue={data.count} 
        onChange={(e) => this.count = parseInt(e.target.value)}
        variant="outlined"
        size="small"
        fullWidth
        sx={nodeStyles.input}
      />
    );
  }
}