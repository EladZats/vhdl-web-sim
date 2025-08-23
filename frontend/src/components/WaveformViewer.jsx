const WaveformViewer = ({ waveforms }) => {
  if (!waveforms) return null;

  return (
    <div className="space-y-2">
      {Object.entries(waveforms).map(([signal, values]) => (
        <div key={signal} className="flex items-center">
          <span className="w-24 truncate font-bold text-cyan-400">{signal}</span>
          <div className="flex-1 flex items-center h-6 bg-gray-900/50 rounded">
            {values.map((val, i) => (
              <div
                key={i}
                className={`h-full flex-1 border-r border-gray-700 ${
                  val === 1 ? 'bg-green-500' : 'bg-transparent'
                }`}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default WaveformViewer;