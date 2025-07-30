'use client';

import { useState } from 'react';

export default function TestInputPage() {
  const [value, setValue] = useState('');
  const [number, setNumber] = useState(0);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Input Test</h1>
      
      <div className="space-y-4 max-w-md">
        <div>
          <label>Normal Input:</label>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full border p-2 rounded"
            placeholder="Type here..."
          />
          <p>Value: {value}</p>
        </div>
        
        <div>
          <label>Number Input:</label>
          <input
            type="number"
            value={number}
            onChange={(e) => setNumber(parseFloat(e.target.value) || 0)}
            className="w-full border p-2 rounded"
            placeholder="0"
          />
          <p>Value: {number}</p>
        </div>

        <div>
          <label>Uncontrolled Number Input:</label>
          <input
            type="number"
            defaultValue={number}
            onChange={(e) => {
              const val = parseFloat(e.target.value) || 0;
              console.log('Uncontrolled input change:', val);
              setNumber(val);
            }}
            className="w-full border p-2 rounded"
            placeholder="0"
          />
          <p>Value: {number}</p>
        </div>
      </div>
    </div>
  );
}
