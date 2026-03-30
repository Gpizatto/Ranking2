import React, { createContext, useContext, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const FederationContext = createContext(null);

export const FederationProvider = ({ children }) => {
  const { slug } = useParams();
  const [federation, setFederation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (slug) fetchFederation();
  }, [slug]);

  const fetchFederation = async () => {
    setLoading(true);
    setNotFound(false);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/federations/${slug}`);
      setFederation(response.data);
    } catch (error) {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const API = `${BACKEND_URL}/api`;

  return (
    <FederationContext.Provider value={{ federation, loading, notFound, slug, API }}>
      {children}
    </FederationContext.Provider>
  );
};

export const useFederation = () => {
  const context = useContext(FederationContext);
  if (!context) throw new Error('useFederation must be used inside FederationProvider');
  return context;
};