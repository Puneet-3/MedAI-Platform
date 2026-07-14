"use client";

import { useState } from "react";
import { 
  Search, 
  Activity, 
  Sparkles, 
  AlertTriangle, 
  Clock, 
  UserPlus, 
  RotateCcw,
  Check
} from "lucide-react";
import Link from "next/link";

// Static list of symptoms derived from symptom_mapping.json
const ALL_SYMPTOMS = [
  "itching", "skin_rash", "nodal_skin_eruptions", "continuous_sneezing", "shivering", "chills", 
  "joint_pain", "stomach_pain", "acidity", "ulcers_on_tongue", "muscle_wasting", "vomiting", 
  "burning_micturition", "spotting_ urination", "fatigue", "weight_gain", "anxiety", 
  "cold_hands_and_feets", "mood_swings", "weight_loss", "restlessness", "lethargy", 
  "patches_in_throat", "irregular_sugar_level", "cough", "high_fever", "sunken_eyes", 
  "breathlessness", "sweating", "dehydration", "indigestion", "headache", "yellowish_skin", 
  "dark_urine", "nausea", "loss_of_appetite", "pain_behind_the_eyes", "back_pain", "constipation", 
  "abdominal_pain", "diarrhoea", "mild_fever", "yellow_urine", "yellowing_of_eyes", 
  "acute_liver_failure", "fluid_overload", "swelling_of_stomach", "swelled_lymph_nodes", "malaise", 
  "blurred_and_distorted_vision", "phlegm", "throat_irritation", "redness_of_eyes", "sinus_pressure", 
  "runny_nose", "congestion", "chest_pain", "weakness_in_limbs", "fast_heart_rate", 
  "pain_during_bowel_movements", "pain_in_anal_region", "bloody_stool", "irritation_in_anus", 
  "neck_pain", "dizziness", "cramps", "bruising", "obesity", "swollen_legs", "swollen_blood_vessels", 
  "puffy_face_and_eyes", "enlarged_thyroid", "brittle_nails", "swollen_extremeties", "excessive_hunger", 
  "extra_marital_contacts", "drying_and_tingling_lips", "slurred_speech", "knee_pain", "hip_joint_pain", 
  "muscle_weakness", "stiff_neck", "swelling_joints", "movement_stiffness", "spinning_movements", 
  "loss_of_balance", "unsteadiness", "weakness_of_one_body_side", "loss_of_smell", "bladder_discomfort", 
  "foul_smell_of urine", "continuous_feel_of_urine", "passage_of_gases", "internal_itching", 
  "toxic_look_(typhos)", "depression", "irritability", "muscle_pain", "altered_sensorium", 
  "red_spots_over_body", "belly_pain", "abnormal_menstruation", "dischromic _patches", "watering_from_eyes", 
  "increased_appetite", "polyuria", "family_history", "mucoid_sputum", "rusty_sputum", 
  "lack_of_concentration", "visual_disturbances", "receiving_blood_transfusion", 
  "receiving_unsterile_injections", "coma", "stomach_bleeding", "distention_of_abdomen", 
  "history_of_alcohol_consumption", "fluid_overload.1", "blood_in_sputum", "prominent_veins_on_calf", 
  "palpitations", "painful_walking", "pus_filled_pimples", "blackheads", "scurring", "skin_peeling", 
  "silver_like_dusting", "small_dents_in_nails", "inflammatory_nails", "blister", 
  "red_sore_around_nose", "yellow_crust_ooze"
];

interface PredictionResult {
  disease: string;
  confidence: number;
}

export default function SymptomCheckerPage() {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<PredictionResult[] | null>(null);
  const [recommendedTest, setRecommendedTest] = useState<string | null>(null);

  // Filter symptoms based on search input
  const filteredSymptoms = ALL_SYMPTOMS.filter((sym) =>
    sym.replace(/_/g, " ").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSymptom = (sym: string) => {
    if (selectedSymptoms.includes(sym)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== sym));
    } else {
      setSelectedSymptoms([...selectedSymptoms, sym]);
    }
  };

  const clearSelection = () => {
    setSelectedSymptoms([]);
    setResults(null);
    setRecommendedTest(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (selectedSymptoms.length === 0) return;

    setLoading(true);
    setError(null);
    setResults(null);
    setRecommendedTest(null);

    try {
      const response = await fetch("/api/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ symptoms: selectedSymptoms }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze symptoms.");
      }

      setResults(data.results);
      setRecommendedTest(data.recommendedTest);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // Format underscore strings into Capitalized words
  const formatSymptom = (sym: string) => {
    return sym
      .replace(/_/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">AI Symptom Checker</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Select your symptoms from our medical database to analyze potential clinical prognoses.
          </p>
        </div>
        {selectedSymptoms.length > 0 && (
          <button
            onClick={clearSelection}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border border-neutral-200 dark:border-neutral-850 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Clear Selection
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Symptom Selector Card */}
        <div className="lg:col-span-7 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 p-6 space-y-6">
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search symptoms (e.g. fever, headache, rash)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
            />
          </div>

          {/* Selected Badges */}
          {selectedSymptoms.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                Selected Symptoms ({selectedSymptoms.length})
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1">
                {selectedSymptoms.map((sym) => (
                  <button
                    key={sym}
                    onClick={() => toggleSymptom(sym)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/40 hover:bg-indigo-100/50 dark:hover:bg-indigo-900/60 transition-colors"
                  >
                    {formatSymptom(sym)}
                    <span className="text-indigo-400 font-bold hover:text-indigo-600">×</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Selector Grid */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Symptom Database
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto pr-2 py-1">
              {filteredSymptoms.map((sym) => {
                const isSelected = selectedSymptoms.includes(sym);
                return (
                  <button
                    key={sym}
                    onClick={() => toggleSymptom(sym)}
                    className={`flex items-center justify-between p-3 rounded-xl text-left border transition-all ${
                      isSelected
                        ? "bg-indigo-600/5 dark:bg-indigo-950/20 border-indigo-500 text-indigo-700 dark:text-indigo-300 font-semibold"
                        : "border-neutral-200/60 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-950"
                    }`}
                  >
                    <span className="text-xs truncate">{formatSymptom(sym)}</span>
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </button>
                );
              })}
              {filteredSymptoms.length === 0 && (
                <div className="col-span-2 text-center py-8 text-neutral-500">
                  No matching symptoms found. Try another query.
                </div>
              )}
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleAnalyze}
            disabled={selectedSymptoms.length === 0 || loading}
            className={`w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md ${
              selectedSymptoms.length > 0 && !loading
                ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/15"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed shadow-none"
            }`}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-indigo-200 border-t-white animate-spin" />
                Analyzing Symptom Patterns...
              </>
            ) : (
              <>
                <Activity className="w-4 h-4" />
                Analyze Symptoms
              </>
            )}
          </button>
        </div>

        {/* Right Side: Results Display Card */}
        <div className="lg:col-span-5 space-y-6">
          {/* Initial State */}
          {!loading && !results && !error && (
            <div className="bg-neutral-50/50 dark:bg-neutral-900/10 border border-dashed border-neutral-250 dark:border-neutral-800 rounded-2xl p-8 text-center h-full flex flex-col items-center justify-center min-h-[300px]">
              <div className="p-3.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <h4 className="text-sm font-bold text-neutral-700 dark:text-neutral-300 mt-4">
                Ready for Analysis
              </h4>
              <p className="text-xs text-neutral-450 dark:text-neutral-500 max-w-xs mt-1">
                Select your symptoms on the left and click "Analyze Symptoms" to get machine learning predictions.
              </p>
            </div>
          )}

          {/* Loading Skeleton */}
          {loading && (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 p-6 space-y-6 animate-pulse">
              <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-1/3" />
              <div className="space-y-3">
                <div className="h-10 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
                <div className="h-6 bg-neutral-200 dark:bg-neutral-800 rounded w-5/6" />
                <div className="h-6 bg-neutral-200 dark:bg-neutral-800 rounded w-2/3" />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-5 rounded-2xl bg-red-50/80 dark:bg-red-950/10 border border-red-200/50 dark:border-red-950/40 text-red-700 dark:text-red-400 space-y-2">
              <div className="flex gap-2">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <h4 className="text-sm font-bold">Analysis Failed</h4>
              </div>
              <p className="text-xs pl-7 leading-relaxed">{error}</p>
            </div>
          )}

          {/* Results Render */}
          {results && (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 p-6 space-y-6">
              <div>
                <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                  Diagnostic Predictions
                </span>
                <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-200 mt-1">
                  Analysis Results
                </h3>
              </div>

              {/* Predictions List */}
              <div className="space-y-4">
                {results.map((res, index) => {
                  const percent = Math.round(res.confidence * 100);
                  const isTop = index === 0;

                  return (
                    <div
                      key={res.disease}
                      className={`p-4 rounded-xl border transition-all ${
                        isTop
                          ? "bg-gradient-to-tr from-indigo-55/20 to-indigo-60/5 dark:from-indigo-950/20 dark:to-indigo-950/5 border-indigo-500/35"
                          : "border-neutral-100 dark:border-neutral-800 bg-neutral-50/30 dark:bg-neutral-950/10"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-bold ${isTop ? "text-indigo-700 dark:text-indigo-400" : "text-neutral-700 dark:text-neutral-300"}`}>
                          {index + 1}. {res.disease}
                        </span>
                        <span className="text-xs font-bold">{percent}%</span>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isTop ? "bg-indigo-600" : "bg-neutral-400 dark:bg-neutral-600"
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Recommended Test Notice */}
              {recommendedTest && (
                <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/40 dark:border-amber-900/20 flex gap-3 text-amber-800 dark:text-amber-300">
                  <Clock className="w-5 h-5 shrink-0 animate-pulse text-amber-500" />
                  <div>
                    <h5 className="text-xs font-bold">Recommended Diagnostic Test</h5>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
                      Due to lower classification confidence, we suggest requesting a **{recommendedTest}**.
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex flex-col gap-3">
                <Link
                  href="/dashboard/consultations"
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 transition-colors text-white text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" /> Consult a Doctor Now
                </Link>
                <p className="text-[10px] text-neutral-450 dark:text-neutral-500 text-center leading-relaxed">
                  Note: AI predictions are for screening and reference only. Please consult a qualified clinical professional for diagnostics.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
