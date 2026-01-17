import React, { useState } from 'react';
import { Plus, Trash2, ChevronRight, Tag, Layers } from 'lucide-react';

interface TagLayer {
    id: string;
    name: string;
    value: string;
    options: string[];
}

interface NestedTagSelectorProps {
    tags: Record<string, string>;
    onChange: (tags: Record<string, string>) => void;
}

const DEFAULT_LAYERS: TagLayer[] = [
    { id: 'l1', name: 'Subject', value: '', options: ['Physics', 'Chemistry', 'Mathematics', 'Biology'] },
    { id: 'l2', name: 'Source', value: '', options: ['PYQ', 'HCV', 'Irodov', 'DC Pandey', 'MS Chauhan'] },
    { id: 'l3', name: 'Chapter', value: '', options: [] },
    { id: 'l4', name: 'Concept', value: '', options: [] },
    { id: 'l5', name: 'Complexity', value: '', options: ['Easy', 'Medium', 'Hard', 'Olympiad'] },
    { id: 'l6', name: 'Question Type', value: '', options: ['MCQ', 'MMCQ', 'MSM', 'Integer', 'Paragraph'] },
];

export const NestedTagSelector: React.FC<NestedTagSelectorProps> = ({ tags, onChange }) => {
    const [layers, setLayers] = useState<TagLayer[]>(() => {
        // Merge provided tags into default layers
        return DEFAULT_LAYERS.map(layer => ({
            ...layer,
            value: tags[layer.name] || ''
        }));
    });

    const [newLayerName, setNewLayerName] = useState('');
    const [isAddingLayer, setIsAddingLayer] = useState(false);

    const updateTag = (layerId: string, val: string) => {
        const updatedLayers = layers.map(l => l.id === layerId ? { ...l, value: val } : l);
        setLayers(updatedLayers);

        // Construct record for parent
        const newTags: Record<string, string> = {};
        updatedLayers.forEach(l => {
            if (l.value) newTags[l.name] = l.value;
        });
        onChange(newTags);
    };

    const addCustomOption = (layerId: string) => {
        const newVal = prompt("Enter new tag name:");
        if (!newVal) return;

        setLayers(layers.map(l =>
            l.id === layerId
                ? { ...l, options: [...l.options, newVal], value: newVal }
                : l
        ));

        const newTags: Record<string, string> = {};
        layers.forEach(l => {
            if (l.id === layerId) newTags[l.name] = newVal;
            else if (l.value) newTags[l.name] = l.value;
        });
        onChange(newTags);
    };

    const addNewLayer = () => {
        if (!newLayerName) return;
        const newLayer: TagLayer = {
            id: `custom-${Date.now()}`,
            name: newLayerName,
            value: '',
            options: []
        };
        setLayers([...layers, newLayer]);
        setNewLayerName('');
        setIsAddingLayer(false);
    };

    const removeLayer = (id: string) => {
        const updated = layers.filter(l => l.id !== id);
        setLayers(updated);

        const newTags: Record<string, string> = {};
        updated.forEach(l => {
            if (l.value) newTags[l.name] = l.value;
        });
        onChange(newTags);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Layers size={16} className="text-emerald-500" />
                    <h3 className="text-[11px] font-bold text-theme-secondary uppercase tracking-[0.2em]">Multi-Layer Classification</h3>
                </div>
                <button
                    onClick={() => setIsAddingLayer(true)}
                    className="text-[10px] font-bold text-emerald-500 hover:text-emerald-400 transition-colors flex items-center gap-1 uppercase tracking-widest"
                >
                    <Plus size={14} /> Add Layer
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {layers.map((layer, index) => (
                    <div key={layer.id} className="group relative p-4 rounded-2xl bg-theme-primary/40 border border-theme-primary hover:border-emerald-500/30 transition-all shadow-theme-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[9px] font-black text-theme-secondary uppercase tracking-widest opacity-60">
                                Layer {index + 1}: {layer.name}
                            </span>
                            <button
                                onClick={() => removeLayer(layer.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-500/10 rounded transition-all"
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>

                        <div className="flex gap-2">
                            <select
                                value={layer.value}
                                onChange={(e) => updateTag(layer.id, e.target.value)}
                                className="flex-1 bg-theme-panel border border-theme-primary rounded-xl px-3 py-2 text-xs text-theme-primary outline-none focus:border-emerald-500/50"
                            >
                                <option value="">Select or Create →</option>
                                {layer.options.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                            <button
                                onClick={() => addCustomOption(layer.id)}
                                className="p-2 bg-theme-panel border border-theme-primary rounded-xl text-theme-secondary hover:text-emerald-500 transition-all"
                                title="Add New Option"
                            >
                                <Plus size={14} />
                            </button>
                        </div>
                    </div>
                ))}

                {isAddingLayer && (
                    <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 animate-in zoom-in-95 duration-200">
                        <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest block mb-2">Configure New Layer</span>
                        <div className="flex gap-2">
                            <input
                                autoFocus
                                placeholder="e.g. Concept"
                                className="flex-1 bg-theme-panel border border-emerald-500/20 rounded-xl px-3 py-2 text-xs text-theme-primary outline-none"
                                value={newLayerName}
                                onChange={e => setNewLayerName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && addNewLayer()}
                            />
                            <button
                                onClick={addNewLayer}
                                className="p-2 bg-emerald-500 text-white rounded-xl"
                            >
                                <Plus size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {Object.keys(tags).length > 0 && (
                <div className="p-4 rounded-3xl bg-theme-secondary border border-theme-primary flex flex-wrap gap-2 items-center">
                    <Tag size={14} className="text-theme-secondary mr-2" />
                    {layers.filter(l => l.value).map((l, i) => (
                        <React.Fragment key={l.id}>
                            <div className="px-2 py-1 rounded-lg bg-theme-primary border border-theme-primary text-[10px] font-bold text-theme-primary flex items-center gap-1.5">
                                <span className="opacity-40">{l.name}:</span>
                                {l.value}
                            </div>
                            {i < layers.filter(l => l.value).length - 1 && <ChevronRight size={10} className="text-theme-secondary opacity-40 mx-1" />}
                        </React.Fragment>
                    ))}
                </div>
            )}
        </div>
    );
};
