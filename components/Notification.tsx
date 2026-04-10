"use client";
import React from "react";

interface ActiveJob {
  jobId: string;
  itemName: string;
  progress: number;
  status: string;
  total: number;
  percentage: number;
  new_records: number;
  updated_records: number;
  skipped_records: number;
}

interface QueueProps {
  activeJobs: ActiveJob[];
  isQueueOpen: boolean;
  setIsQueueOpen: (open: boolean) => void;
  removeJob: (id: string) => void;
}

export const QueueNotification = ({
  activeJobs,
  isQueueOpen,
  setIsQueueOpen,
  removeJob,
}: QueueProps) => {
  return (
    <div className="fixed bottom-0 right-8 w-80 bg-white border border-gray-200 shadow-2xl rounded-t-lg overflow-hidden z-[9999]">
      <div
        className="bg-gray-900 text-white p-3 flex justify-between items-center cursor-pointer"
        onClick={() => setIsQueueOpen(!isQueueOpen)}
      >
        <span className="text-xs font-bold uppercase tracking-wider">
          {activeJobs.length} Uploads
        </span>
        <i
          className={
            isQueueOpen ? "ri-arrow-down-s-line" : "ri-arrow-up-s-line"
          }
        ></i>
      </div>

      {isQueueOpen && (
        <div className="max-h-96 overflow-y-auto p-2 space-y-2 bg-white">
          {activeJobs.map((job) => (
            <div
              key={job.jobId}
              className="p-3 border-b border-gray-50 last:border-0"
            >
              <div className="flex justify-between items-start mb-1">
                <span className="text-[10px] font-bold uppercase truncate w-32">
                  {job.itemName}
                </span>
                <div className="flex items-center gap-2">
                  {job.status === "done" ? (
                    <i className="ri-checkbox-circle-fill text-green-500"></i>
                  ) : job.status === "failed" ? (
                    <i className="ri-error-warning-fill text-red-500"></i>
                  ) : (
                    <span className="text-[9px] font-mono text-blue-600 font-bold">
                      {Math.round(job.percentage)}%
                    </span>
                  )}
                  <button
                    onClick={() => removeJob(job.jobId)}
                    className="hover:bg-gray-100 rounded-full p-0.5 transition-colors"
                  >
                    <i className="ri-close-line text-gray-400 font-bold"></i>
                  </button>
                </div>
              </div>

              {job.status === "done" ? (
                <div className="mt-2 flex gap-1 animate-in slide-in-from-left duration-500">
                  <div className="flex-1 bg-gray-100 rounded-xl p-2 flex flex-col items-center justify-center border border-gray-200">
                    <div className="flex gap-2 w-full">
                      <div className="flex-1 bg-white rounded-xl p-2 flex flex-col items-center justify-center border border-gray-200 shadow-sm">
                        <span className="text-[8px] font-black text-gray-400 uppercase">
                          Total
                        </span>
                        <span className="text-[10px] font-black text-black">
                          {job.total || 0}
                        </span>
                      </div>
                      {job.new_records > 0 && (
                        <div className="flex-1 bg-green-50 rounded-xl p-2 flex flex-col items-center justify-center border border-green-200">
                          <span className="text-[8px] font-black text-green-600 uppercase">
                            New
                          </span>
                          <span className="text-[10px] font-black text-green-700">
                            {job.new_records}
                          </span>
                        </div>
                      )}
                      {job.updated_records > 0 && (
                        <div className="flex-1 bg-blue-50 rounded-xl p-2 flex flex-col items-center justify-center border border-blue-200">
                          <span className="text-[8px] font-black text-blue-600 uppercase">
                            Upd
                          </span>
                          <span className="text-[10px] font-black text-blue-700">
                            {job.updated_records}
                          </span>
                        </div>
                      )}
                      {job.skipped_records > 0 &&
                        job.new_records === 0 &&
                        job.updated_records === 0 && (
                          <div className="flex-1 bg-gray-50 rounded-xl p-2 flex flex-col items-center justify-center border border-gray-200">
                            <span className="text-[8px] font-black text-gray-400 uppercase">
                              Skip
                            </span>
                            <span className="text-[10px] font-black text-gray-600">
                              {job.skipped_records}
                            </span>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mt-2">
                  <div
                    className={`h-full transition-all duration-300 ${job.status === "failed" ? "bg-red-500" : "bg-blue-600"}`}
                    style={{ width: `${job.percentage}%` }}
                  ></div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
