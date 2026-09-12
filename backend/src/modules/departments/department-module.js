// Export a higher-order function that wraps the module exports
const departmentModuleHandler = (moduleFactory) => {
  return moduleFactory();
};

module.exports = { departmentModuleHandler };

