import React, { useEffect, useMemo, useRef, useState } from 'react';

const WIDTH = 800;
const HEIGHT = 96;
const TARGET_RATIO = WIDTH / HEIGHT;

interface Transcript {
  id: number;
  text: string;
  preview?: string;
  submitted?: boolean;
}

interface Person {
  id: number;
  name: string;
  transcripts: Transcript[];
}

const initialPeople: Person[] = [
  {
    id: 1,
    name: 'John Doe',
    transcripts: [
      {
        id: 1,
        text: 'The quick brown fox jumps over the lazy dog.',
      },
      {
        id: 2,
        text: 'Artificial intelligence improves handwriting recognition.',
      },
      {
        id: 3,
        text: 'Data collection is important for machine learning.',
      },
    ],
  },

  {
    id: 2,
    name: 'Jane Smith',
    transcripts: [
      {
        id: 1,
        text: 'Handwriting samples help improve OCR systems.',
      },
      {
        id: 2,
        text: 'Neural networks require quality datasets.',
      },
    ],
  },

  {
    id: 3,
    name: 'Michael Cruz',
    transcripts: [],
  },
];

const App: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [people, setPeople] = useState<Person[]>(initialPeople);

  const [selectedPersonId, setSelectedPersonId] =
    useState<number | null>(null);

  const [currentTranscriptIndex, setCurrentTranscriptIndex] =
    useState(0);

  const [capturePreview, setCapturePreview] = useState('');

  const [error, setError] = useState('');

  const selectedPerson = useMemo(() => {
    return people.find((p) => p.id === selectedPersonId);
  }, [people, selectedPersonId]);

  // Only show pending transcripts
  const pendingTranscripts =
    selectedPerson?.transcripts.filter(
      (t) => !t.submitted
    ) || [];

  const currentTranscript =
    pendingTranscripts[currentTranscriptIndex];

  useEffect(() => {
    if (selectedPersonId !== null) {
      startCamera();
    }

    return () => stopCamera();
  }, [selectedPersonId]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error(err);
      setError('Unable to access camera');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;

      stream.getTracks().forEach((track) => track.stop());
    }
  };

  // ============================
  // CAPTURE PREVIEW
  // ============================

  const generatePreview = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (
      !video ||
      !canvas ||
      !selectedPerson ||
      !currentTranscript
    )
      return;

    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    const videoRatio = videoWidth / videoHeight;

    let cropWidth = videoWidth;
    let cropHeight = videoHeight;

    if (videoRatio > TARGET_RATIO) {
      cropWidth = videoHeight * TARGET_RATIO;
    } else {
      cropHeight = videoWidth / TARGET_RATIO;
    }

    const offsetX = (videoWidth - cropWidth) / 2;
    const offsetY = (videoHeight - cropHeight) / 2;

    ctx.drawImage(
      video,
      offsetX,
      offsetY,
      cropWidth,
      cropHeight,
      0,
      0,
      WIDTH,
      HEIGHT
    );

    const image = canvas.toDataURL('image/png');

    setCapturePreview(image);
  };

  // ============================
  // FINAL UPLOAD
  // ============================

  const uploadCapture = () => {
    if (
      !selectedPerson ||
      !currentTranscript ||
      !capturePreview
    )
      return;

    setPeople((prev) =>
      prev.map((person) => {
        if (person.id !== selectedPerson.id) return person;

        return {
          ...person,
          transcripts: person.transcripts.map((transcript) =>
            transcript.id === currentTranscript.id
              ? {
                  ...transcript,
                  preview: capturePreview,
                  submitted: true,
                }
              : transcript
          ),
        };
      })
    );

    // Clear preview
    setCapturePreview('');

    // Reset to first pending transcript
    setCurrentTranscriptIndex(0);

    const remaining =
      pendingTranscripts.length - 1;

    if (remaining <= 0) {
      alert('All transcripts submitted.');

      setSelectedPersonId(null);
    }
  };

  // ======================================
  // PARTICIPANT SELECTION SCREEN
  // ======================================

  if (selectedPersonId === null) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">

          <h1 className="text-4xl font-bold mb-3">
            Select Participant
          </h1>

          <p className="text-slate-400 mb-8">
            Choose your participant profile.
          </p>

          <div className="space-y-4">
            {people.map((person) => (
              <button
                key={person.id}
                onClick={() => {
                  setSelectedPersonId(person.id);
                  setCurrentTranscriptIndex(0);
                }}
                className="w-full p-5 rounded-2xl text-left border border-slate-700 bg-slate-800 hover:bg-slate-700 hover:border-cyan-400 transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xl font-semibold">
                      {person.name}
                    </p>

                    <p className="text-sm text-slate-400 mt-1">
                      {
                        person.transcripts.filter(
                          (t) => !t.submitted
                        ).length
                      }{' '}
                      pending transcript(s)
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ======================================
  // NO TRANSCRIPT AVAILABLE
  // ======================================

  if (pendingTranscripts.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center max-w-lg w-full">

          <h1 className="text-3xl font-bold mb-4">
            {selectedPerson?.name}
          </h1>

          <p className="text-slate-400 text-lg">
            There are no transcripts for you right now.
          </p>

          <button
            onClick={() => setSelectedPersonId(null)}
            className="mt-8 px-6 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold transition"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  // ======================================
  // MAIN APPLICATION
  // ======================================

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-6xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">

        {/* HEADER */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Handwriting Upload
            </h1>

            <p className="text-slate-400 mt-2">
              Participant: {selectedPerson?.name}
            </p>
          </div>

          <button
            onClick={() => {
              setSelectedPersonId(null);
              setCurrentTranscriptIndex(0);
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition"
          >
            Change Participant
          </button>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 p-6">

          {/* LEFT SIDE */}
          <div className="space-y-4">

            {/* CURRENT TRANSCRIPT */}
            {currentTranscript && (
              <div className="bg-slate-950 border border-slate-700 rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">
                    Current Transcript
                  </h2>

                  <span className="text-sm text-slate-400">
                    Remaining:{' '}
                    {pendingTranscripts.length}
                  </span>
                </div>

                <div className="mt-4 p-4 rounded-xl bg-slate-800 border border-slate-700 text-lg leading-relaxed">
                  “{currentTranscript.text}”
                </div>
              </div>
            )}

            {/* CAMERA */}
            <div className="relative bg-black rounded-2xl overflow-hidden border border-slate-700">

              {error ? (
                <div className="p-10 text-red-400 text-center">
                  {error}
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-auto object-cover"
                  />

                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div
                      className="border-2 border-cyan-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]"
                      style={{
                        width: '80%',
                        aspectRatio: `${WIDTH} / ${HEIGHT}`,
                      }}
                    />
                  </div>
                </>
              )}
            </div>

            {/* ACTION BUTTONS */}
            {!capturePreview ? (
              <button
                onClick={generatePreview}
                className="w-full py-4 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold transition"
              >
                Preview Capture
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setCapturePreview('')}
                  className="py-4 rounded-2xl bg-slate-700 hover:bg-slate-600 font-bold transition"
                >
                  Retake
                </button>

                <button
                  onClick={uploadCapture}
                  className="py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold transition"
                >
                  Confirm Upload
                </button>
              </div>
            )}
          </div>

          {/* RIGHT SIDE */}
          <div className="bg-slate-950 border border-slate-700 rounded-2xl p-6">

            <h2 className="text-2xl font-bold mb-6">
              Preview
            </h2>

            {capturePreview ? (
              <img
                src={capturePreview}
                alt="Capture preview"
                className="w-full rounded-2xl border border-cyan-500"
              />
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-center">
                Capture preview will appear here
              </div>
            )}
          </div>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};

export default App