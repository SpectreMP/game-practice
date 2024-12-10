class BaseNode {
    constructor(id, type, data = {}) {
      this.id = id;
      this.type = type;
      this.data = data;
      this.inputs = [];
      this.outputs = [];
    }
  
    addInput(name, type) {
      this.inputs.push({ name, type });
    }
  
    addOutput(name, type) {
      this.outputs.push({ name, type });
    }
  
    execute(inputValues) {
      // Base implementation, must be overridden in subclasses
      throw new Error('Method not implemented');
    }
  }
  
  export default BaseNode;