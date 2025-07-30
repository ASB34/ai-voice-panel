// Production console override
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  // Keep error logs but remove dev logs
  const originalLog = console.log;
  const originalInfo = console.info;
  const originalWarn = console.warn;
  
  console.log = () => {};
  console.info = () => {};
  console.warn = (...args) => {
    // Only show warnings in production
    if (args.some(arg => 
      typeof arg === 'string' && 
      (arg.includes('Warning') || arg.includes('error'))
    )) {
      originalWarn(...args);
    }
  };
}
