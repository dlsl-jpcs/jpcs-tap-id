import React from "react";

interface EventModalProps {
  showEventModal: boolean;
  newEventName: string;
  setNewEventName: (name: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

const EventModal: React.FC<EventModalProps> = ({
  showEventModal,
  newEventName,
  setNewEventName,
  onConfirm,
  onCancel,
  onKeyPress,
}) => {
  if (!showEventModal) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-green-400/50 rounded-xl p-6 w-full max-w-md">
        <h3 className="text-xl font-bold text-light-green mb-4">New Event</h3>
        <p className="text-gray-300 mb-4">Enter a name for the new event:</p>
        <input
          type="text"
          value={newEventName}
          onChange={(e) => setNewEventName(e.target.value)}
          onKeyPress={onKeyPress}
          placeholder="Event Name"
          className="w-full px-4 py-3 bg-gray-800 border border-green-400/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400 mb-6"
          autoFocus
        />
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!newEventName.trim()}
            className="px-4 py-2 bg-light-green hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200"
          >
            Create Event
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventModal;
