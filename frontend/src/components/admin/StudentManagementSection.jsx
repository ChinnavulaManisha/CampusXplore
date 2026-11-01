import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Calendar,
  AlertTriangle,
  Mail,
  UserCheck,
  UserX,
} from 'lucide-react';
import studentService from '../../services/studentService';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import Alert from '../common/Alert';
import { formatDate } from '../../utils/formatters';

export default function StudentManagementSection() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Pagination
  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  const loadStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        pageSize,
      };
      if (submittedSearch.trim()) {
        params.search = submittedSearch.trim();
      }

      const data = await studentService.getStudents(params);
      setStudents(data.results || []);
      setTotalCount(data.count || 0);
    } catch (err) {
      console.error('Failed to load students:', err);
      setError('Failed to load student accounts. Please check network connectivity.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, submittedSearch]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    setSubmittedSearch(search);
  };

  const handleResetSearch = () => {
    setSearch('');
    setSubmittedSearch('');
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <span>Student Directory & Activity</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Read-only directory of enrolled student accounts, registration history, and issue reports submitted.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadStudents}
            disabled={loading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2 max-w-lg">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name or university email..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" type="submit" disabled={loading}>
            Search
          </Button>
          {submittedSearch && (
            <Button variant="secondary" size="sm" type="button" onClick={handleResetSearch}>
              Reset
            </Button>
          )}
        </div>
      </form>

      {/* Students Table */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center space-y-3">
          <Spinner size="lg" />
          <p className="text-xs text-slate-500">Loading student directory...</p>
        </div>
      ) : students.length === 0 ? (
        <div className="py-12 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 space-y-2">
          <Users className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-sm font-semibold text-slate-700">No students found</p>
          <p className="text-xs text-slate-500">
            {submittedSearch
              ? `No student accounts matched "${submittedSearch}".`
              : 'No student accounts are currently registered in the system.'}
          </p>
          {submittedSearch && (
            <button
              onClick={handleResetSearch}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium underline"
            >
              Clear search filter
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-3">Email Address</th>
                <th className="py-3 px-3">Account Status</th>
                <th className="py-3 px-3">Joined Date</th>
                <th className="py-3 px-4 text-center">Reports Filed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((student) => {
                const fullName = [student.first_name, student.last_name].filter(Boolean).join(' ') || 'Student';
                return (
                  <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{fullName}</div>
                      <div className="text-[10px] text-slate-400">ID #{student.id}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      <div className="flex items-center gap-1.5 font-mono text-[11px]">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{student.email}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      {student.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <UserCheck className="w-3 h-3 text-emerald-600" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                          <UserX className="w-3 h-3 text-rose-600" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      <div className="flex items-center gap-1 text-[11px]">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDate(student.date_joined || student.created_at)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          student.report_count > 0
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        <AlertTriangle className="w-3 h-3" />
                        {student.report_count ?? 0}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {totalCount > pageSize && (
        <div className="flex items-center justify-between pt-2 text-xs text-slate-600">
          <div>
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, totalCount)} of {totalCount} students
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1 || loading}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 text-xs"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" />
              Previous
            </Button>
            <span className="px-2 font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages || loading}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 text-xs"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
