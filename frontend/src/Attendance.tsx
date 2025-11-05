import React, { useState, useEffect, useRef } from "react";
import { useLocalStorage } from "./useLocalStorage";
import EventModal from "./EventModal";
import ImportModal from "./ImportModal";

const API_BASE_URL = "http://localhost:10000/api";

interface Student {
  id: string;
  name: string;
  email: string;
  timestamp: Date;
  isRegistered?: boolean;
}

interface RecentTap {
  name: string;
  id: string;
  timestamp: Date;
  isRegistered?: boolean;
}

interface ApiResponse {
  id: string;
  name: string;
  email: string;
  timestamp?: string;
  error?: string;
}

const Attendance: React.FC = () => {
  const [studentId, setStudentId] = useState<string>("");
  const [tappedStudents, setTappedStudents] = useLocalStorage<Student[]>(
    "attendance-list",
    []
  );
  const [recentTap, setRecentTap] = useState<RecentTap | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [eventName, setEventName] = useLocalStorage<string>(
    "event-name",
    "JPCS Event"
  );
  const [showEventModal, setShowEventModal] = useState<boolean>(false);
  const [newEventName, setNewEventName] = useState<string>("");
  const [registeredEmails, setRegisteredEmails] = useLocalStorage<string[]>(
    "registered-emails",
    []
  );
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const isProcessingRef = useRef<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isGlobalInputRef = useRef<boolean>(false);

  useEffect(() => {
    const handleGlobalKeyPress = (e: KeyboardEvent): void => {
      if (
        isProcessingRef.current ||
        showEventModal ||
        showImportModal ||
        e.key === "Enter"
      ) {
        return;
      }

      if (e.key.length === 1 && /[a-zA-Z0-9]/.test(e.key)) {
        isGlobalInputRef.current = true;

        if (inputRef.current && document.activeElement !== inputRef.current) {
          inputRef.current.focus();
        }

        setStudentId((prev) => prev + e.key);

        e.preventDefault();
      }
    };

    document.addEventListener("keydown", handleGlobalKeyPress);

    return () => {
      document.removeEventListener("keydown", handleGlobalKeyPress);
    };
  }, [showEventModal, showImportModal]);

  useEffect(() => {
    if (isGlobalInputRef.current) {
      const timer = setTimeout(() => {
        isGlobalInputRef.current = false;
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [studentId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (isGlobalInputRef.current) {
      return;
    }

    setStudentId(e.target.value);
  };

  const checkIfRegistered = (email: string): boolean => {
    return registeredEmails.includes(email.toLowerCase());
  };

  const handleTap = async (): Promise<void> => {
    if (!studentId.trim() || isProcessingRef.current) {
      return;
    }

    isProcessingRef.current = true;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE_URL}/tap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: studentId.trim() }),
      });

      const data: ApiResponse = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to tap student");

      const displayName = data.name;
      const isRegistered = checkIfRegistered(data.email);

      setRecentTap({
        name: displayName,
        id: studentId,
        timestamp: new Date(),
        isRegistered,
      });

      const newStudent: Student = {
        id: studentId,
        name: displayName,
        email: data.email,
        timestamp: new Date(),
        isRegistered,
      };

      setTappedStudents([newStudent, ...tappedStudents]);
      setStudentId("");

      setTimeout(() => {
        setRecentTap(null);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
      isProcessingRef.current = false;
    }
  };

  const handleNewEvent = (): void => {
    setNewEventName(eventName);
    setShowEventModal(true);
  };

  const confirmNewEvent = async (): Promise<void> => {
    if (newEventName.trim()) {
      try {
        const response = await fetch(`${API_BASE_URL}/event`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newEventName.trim() }),
        });

        if (response.ok) {
          setEventName(newEventName.trim());
          setTappedStudents([]);
          setRegisteredEmails([]);
          setShowEventModal(false);
          setNewEventName("");
        }
      } catch (err) {
        console.error("Failed to set event name:", err);
      }
    }
  };

  const cancelNewEvent = (): void => {
    setShowEventModal(false);
    setNewEventName("");
  };

 const handleCsvImport = (event: React.ChangeEvent<HTMLInputElement>): void => {
   const file = event.target.files?.[0];
   if (!file) return;

   const reader = new FileReader();
   reader.onload = async (e) => {
     try {
       const csvText = e.target?.result as string;
       const lines = csvText.split("\n");
       const importedEmails: string[] = [];

       for (let i = 1; i < lines.length; i++) {
         const line = lines[i].trim();
         if (!line) continue;

         const columns = line.split(",").map((col) => col.trim());
         if (columns.length >= 2 && columns[1]) {
           const email = columns[1].toLowerCase();
           if (email.includes("@") && !importedEmails.includes(email)) {
             importedEmails.push(email);
           }
         }
       }

       setRegisteredEmails(importedEmails);

       try {
         const response = await fetch(`${API_BASE_URL}/import-registered`, {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({ emails: importedEmails }),
         });

         if (!response.ok) {
           throw new Error("Failed to sync with server");
         }
       } catch (err) {
         console.error("Failed to sync registered students with server:", err);
       }

       setShowImportModal(false);

       setTappedStudents((prev) =>
         prev.map((student) => ({
           ...student,
           isRegistered: checkIfRegistered(student.email),
         }))
       );

       alert(
         `Successfully imported ${importedEmails.length} registered emails`
       );
     } catch (error) {
       alert("Error parsing CSV file. Please check the format.");
       console.error("CSV parsing error:", error);
     }
   };

   reader.readAsText(file);
   event.target.value = "";
 };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") {
      if (showEventModal) {
        confirmNewEvent();
      } else {
        handleTap();
      }
    }
  };

  const handleManualTap = (): void => {
    if (!isProcessingRef.current) {
      handleTap();
    }
  };

  return (
    <div className="relative min-h-screen w-full p-2 mx-auto bg-[#141414]">
      <h1 className="mx-auto text-center text-3xl text-light-green font-bold mt-4 ">
        {eventName}
      </h1>

      <div className="text-center mb-4 text-slate-50 font-bold">
        <h1>
          <span className="text-green-400 ">JPCS</span> Attendance
        </h1>
      </div>

      <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 w-[90%]  max-w-6xl mx-auto z-10 py-2">
        {/* Left Column - Tap Interface */}
        <div className="bg-[#0f0f0f] backdrop-blur-md border border-green-400/50 p-6 rounded-xl shadow-lg min-h-[500px] flex flex-col items-center justify-center md:col-span-1 gap-3">
          {recentTap ? (
            <div className="text-center animate-pulse">
              <div
                className={`w-16 h-16 mx-auto mb-3 bg-light-green rounded-full flex items-center justify-center`}
              >
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-green-400 mb-2">
                Welcome!
              </h2>
              <p className="text-lg text-white font-semibold">
                {recentTap.name}
              </p>
              <p className="text-gray-300 text-sm">ID: {recentTap.id}</p>
              <p
                className={`text-xs mt-2 ${
                  recentTap.isRegistered ? "text-green-300" : "text-yellow-300"
                }`}
              >
                {recentTap.isRegistered ? "Pre-registered" : "Walk-in attendee"}
              </p>
              <p className="text-gray-400 text-xs mt-2">
                {recentTap.timestamp.toLocaleTimeString()}
              </p>
            </div>
          ) : (
            <>
              <div className="w-20 h-20 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center border-2 border-dashed border-green-400/50">
                <svg
                  className="w-10 h-10 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>

              <h2 className="text-xl font-bold text-green-400 mb-2">
                Tap Your ID
              </h2>
              <p className="text-gray-400 text-center mb-4 text-sm">
                Tap your ID or Enter student ID to mark your attendance
              </p>

              <div className="w-full max-w-xs space-y-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={studentId}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter Student ID"
                  className="w-full px-3 py-2 bg-gray-800 border border-green-400/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400 text-sm"
                  disabled={loading}
                />

                <button
                  onClick={handleManualTap}
                  disabled={loading}
                  className="w-full py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-semibold rounded-2xl transition-colors duration-200 flex items-center justify-center text-sm"
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    "Tap In"
                  )}
                </button>
              </div>

              {error && (
                <div className="mt-3 p-2 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-xs">
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Column - Student List */}
        <div className="bg-[#0f0f0f] backdrop-blur-md border border-green-400/50 p-6 rounded-xl shadow-lg md:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-white">
              Attendance List ({tappedStudents.length})
            </h2>
            <div className="flex gap-2">
              <button
                onClick={handleNewEvent}
                className="text-[12px] px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-2xl transition-colors duration-200 flex items-center"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                New Event
              </button>

              <button
                onClick={() => setShowImportModal(true)}
                className="text-[12px] px-4 py-1.5 bg-white/10 border border-light-green hover:bg-white/5 text-light-green font-medium rounded-2xl transition-colors duration-200 flex items-center"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                  />
                </svg>
                Import CSV
              </button>

              {tappedStudents.length > 0 && (
                <button
                  onClick={() => window.open(`${API_BASE_URL}/export`)}
                  className="text-[12px] px-4 py-1.5 bg-white/10 border border-light-green hover:bg-white/5 text-light-green font-medium rounded-2xl transition-colors duration-200 flex items-center"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Export CSV
                </button>
              )}
            </div>
          </div>

          {tappedStudents.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p>No students have tapped in yet</p>
              <p className="text-sm text-gray-500 mt-2">
                Start a new event by tapping student IDs
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-green-400/30 scrollbar-track-transparent hover:scrollbar-thumb-green-400/50">
              {tappedStudents.map((student) => (
                <div
                  key={`${student.id}-${student.timestamp.getTime()}`}
                  className={`bg-gray-800/50 border rounded-lg p-4 hover:border-light-green/40 transition-colors duration-200 border-light-green/50`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white text-lg">
                          {student.name}
                        </h3>
                        {student.isRegistered && (
                          <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-full">
                            Registered
                          </span>
                        )}
                        {!student.isRegistered && (
                          <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded-full">
                            Walk-in
                          </span>
                        )}
                      </div>
                      <p className="text-gray-300 text-sm">ID: {student.id}</p>
                      {student.email && (
                        <p className="text-gray-400 text-xs">{student.email}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 text-sm font-medium">
                        {student.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {student.timestamp.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <EventModal
        showEventModal={showEventModal}
        newEventName={newEventName}
        setNewEventName={setNewEventName}
        onConfirm={confirmNewEvent}
        onCancel={cancelNewEvent}
        onKeyPress={handleKeyPress}
      />

      <ImportModal
        showImportModal={showImportModal}
        onFileImport={handleCsvImport}
        onClose={() => setShowImportModal(false)}
      />
    </div>
  );
};

export default Attendance;
