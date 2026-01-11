'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getProduct } from '@/lib/actions/getProduct';

export default function Searchbar() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const match = url.match(/\/dp\/([A-Z0-9]{10})/);
    if (!match) return alert('Invalid Amazon link');

    try {
      setLoading(true);
      await getProduct(match[1]);
      router.refresh();
      setUrl('');
    } catch {
      alert('Failed to fetch product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-4 mt-6">
      <input
        value={url}
        onChange={e => setUrl(e.target.value)}
        placeholder="Paste Amazon product link"
        className="searchbar-input"
      />
      <button disabled={loading} className="searchbar-btn">
        {loading ? 'Fetching…' : 'Search'}
      </button>
    </form>
  );
}
