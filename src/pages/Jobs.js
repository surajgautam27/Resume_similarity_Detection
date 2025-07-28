import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import JobPostForm from './JobPostForm';
import JobList from './JobList';
import JobManagement from './JobManagement';

export default function Jobs() {
  const { user } = useAuth();

  if (!user) return <div>Please log in to view this page.</div>;

  if (user.role === 'company') {
    return <JobManagement />;
  }

  if (user.role === 'developer') {
    return <JobList />;
  }

  return <div>Unauthorized</div>;
}