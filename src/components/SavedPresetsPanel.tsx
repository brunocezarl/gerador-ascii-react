import { useState } from 'react';
import { MAX_PRESET_NAME, type SavedPresets } from '../savedPresets';

interface SavedPresetsPanelProps {
  presets: SavedPresets;
  onSave: (name: string) => void;
  onLoad: (name: string) => void;
  onDelete: (name: string) => void;
}

const SavedPresetsPanel = ({ presets, onSave, onLoad, onDelete }: SavedPresetsPanelProps) => {
  const [name, setName] = useState('');
  const names = Object.keys(presets);

  return (
    <div className="control-group">
      <h3>Presets</h3>
      <form
        className="save-row"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          onSave(name);
          setName('');
        }}
      >
        <input
          type="text"
          aria-label="Preset name"
          placeholder="Preset name"
          maxLength={MAX_PRESET_NAME}
          value={name}
          className="input-field"
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit" className="button-secondary" disabled={!name.trim()}>Save preset</button>
      </form>

      {names.length === 0 ? (
        <p className="notice">No presets saved in this browser.</p>
      ) : (
        <ul className="saved-list">
          {names.map((presetName) => (
            <li key={presetName} className="saved-item">
              <button type="button" className="saved-name" onClick={() => onLoad(presetName)}>
                {presetName}
              </button>
              <button
                type="button"
                className="icon-button"
                aria-label={`Delete preset ${presetName}`}
                onClick={() => onDelete(presetName)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SavedPresetsPanel;
