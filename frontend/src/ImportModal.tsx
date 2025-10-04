import React from "react";

interface ImportModalProps {
  showImportModal: boolean;
  onFileImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClose: () => void;
}

const ImportModal: React.FC<ImportModalProps> = ({
  showImportModal,
  onFileImport,
  onClose,
}) => {
  if (!showImportModal) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-green-400/50 rounded-xl p-6 w-full max-w-md">
        <h3 className="text-xl font-bold text-light-green mb-4">
          Import Registered Emails
        </h3>
        <p className="text-gray-300 mb-4">
          Upload a CSV file with registered attendees.
        </p>
        <div className="mb-4 p-3 bg-green-500/10 border border-green-400/30 rounded-lg">
          <p className="text-green-300 text-sm">
            <strong>Expected CSV Format:</strong>
            <br />
            The system only reads the second column for email addresses.
          </p>
        </div>
        <input
          type="file"
          accept=".csv"
          onChange={onFileImport}
          className="w-full px-4 py-3 bg-gray-800 border border-green-400/30 rounded-lg text-white mb-6 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-500 file:text-white hover:file:bg-green-600"
        />
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors duration-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportModal;
