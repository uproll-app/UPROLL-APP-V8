import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Pin,
  Trash2,
  Edit3,
  Eye,
  RefreshCw,
  CheckCircle2,
  Sparkles,
  Smartphone,
  Layers,
  HelpCircle,
  Film,
  Image as ImageIcon,
  Check,
  X,
  Radio,
  Bookmark,
  Share2,
  Flame,
  ArrowUpRight,
  Filter
} from 'lucide-react';
import {
  ExtendedArticleData,
  subscribeToArticles,
  publishArticle,
  updateArticleInFirestore,
  deleteArticleFromFirestore,
  INITIAL_SEED_ARTICLES
} from '../lib/newsService';

interface MinimalCmsDashboardProps {
  onOpenMobileReader: () => void;
  onSelectArticleForReader?: (articleId: string) => void;
}

const PRESET_IMAGES = [
  { label: 'Cinema Studio', url: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=1000&auto=format&fit=crop' },
  { label: 'Theater Hall', url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1000&auto=format&fit=crop' },
  { label: 'Movie Projector', url: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=1000&auto=format&fit=crop' },
  { label: 'Red Carpet', url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1000&auto=format&fit=crop' },
  { label: 'Actor Studio', url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?q=80&w=1000&auto=format&fit=crop' },
  { label: 'Film Festival', url: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=1000&auto=format&fit=crop' },
];

const CATEGORIES = [
  'Movies & TV Shows',
  'Mollywood',
  'Box Office',
  'Celebrity',
  'Fan Opinion',
  'Reviews',
  'Ask Battles'
];

export function MinimalCmsDashboard({ onOpenMobileReader, onSelectArticleForReader }: MinimalCmsDashboardProps) {
  const [articles, setArticles] = useState<ExtendedArticleData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Editor Modal State
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Form Fields
  const [formType, setFormType] = useState<'news' | 'poll' | 'quiz' | 'movie_review' | 'gallery'>('news');
  const [formTitle, setFormTitle] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>('Movies & TV Shows');
  const [formSummary, setFormSummary] = useState<string>('');
  const [formFullContent, setFormFullContent] = useState<string>('');
  const [formFeatureImage, setFormFeatureImage] = useState<string>(PRESET_IMAGES[0].url);
  const [formAuthor, setFormAuthor] = useState<string>('UPROLL Desk');
  const [formStatus, setFormStatus] = useState<'Live' | 'Draft'>('Live');
  const [formIsPinned, setFormIsPinned] = useState<boolean>(false);
  const [formPinSpot, setFormPinSpot] = useState<number>(1);
  
  // Movie Review Specs (No star rating)
  const [formDirector, setFormDirector] = useState<string>('Vysakh');
  const [formCast, setFormCast] = useState<string>('Unni Mukundan, Siddique, Lena');
  const [formMusicDirector, setFormMusicDirector] = useState<string>('Jakes Bejoy');
  const [formCinematography, setFormCinematography] = useState<string>('Shaji Kumar');
  const [formRuntime, setFormRuntime] = useState<string>('2h 30m');
  const [formYear, setFormYear] = useState<string>('2026');
  const [formCertificate, setFormCertificate] = useState<string>('U/A 16+');
  const [formVerdict, setFormVerdict] = useState<string>('MUST WATCH');
  const [formPros, setFormPros] = useState<string>('High octane action sequences, electrifying BGM');
  const [formCons, setFormCons] = useState<string>('Slightly stretched middle act');
  
  // Choice options for Poll/Quiz
  const [choiceOptions, setChoiceOptions] = useState<string[]>([
    'Option 1',
    'Option 2'
  ]);

  // Subscribe to live articles
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeToArticles((data) => {
      setArticles(data || INITIAL_SEED_ARTICLES);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenCreateModal = () => {
    setEditingArticleId(null);
    setFormType('news');
    setFormTitle('');
    setFormCategory('Movies & TV Shows');
    setFormSummary('');
    setFormFullContent('');
    setFormFeatureImage(PRESET_IMAGES[Math.floor(Math.random() * PRESET_IMAGES.length)].url);
    setFormAuthor('UPROLL Desk');
    setFormStatus('Live');
    setFormIsPinned(false);
    setFormPinSpot(1);
    setFormDirector('Vysakh');
    setFormCast('Unni Mukundan, Siddique, Lena');
    setFormMusicDirector('Jakes Bejoy');
    setFormCinematography('Shaji Kumar');
    setFormRuntime('2h 30m');
    setFormYear('2026');
    setFormCertificate('U/A 16+');
    setFormVerdict('MUST WATCH');
    setFormPros('High octane action sequences, electrifying BGM');
    setFormCons('Slightly stretched middle act');
    setChoiceOptions(['Option 1', 'Option 2']);
    setIsEditorOpen(true);
  };

  const handleOpenEditModal = (art: ExtendedArticleData) => {
    setEditingArticleId(art.id);
    setFormType((art.type as any) || 'news');
    setFormTitle(art.title || '');
    setFormCategory(art.category || 'Movies & TV Shows');
    setFormSummary(art.summary || '');
    setFormFullContent(art.fullContent || '');
    setFormFeatureImage(art.featureImage || PRESET_IMAGES[0].url);
    setFormAuthor(art.author || 'UPROLL Desk');
    setFormStatus(art.status === 'Draft' ? 'Draft' : 'Live');
    setFormIsPinned(art.isPinned || false);
    setFormPinSpot(1);
    setFormDirector(art.director || 'Vysakh');
    setFormCast(art.cast || 'Unni Mukundan, Siddique, Lena');
    setFormMusicDirector(art.musicDirector || 'Jakes Bejoy');
    setFormCinematography(art.cinematography || 'Shaji Kumar');
    setFormRuntime(art.runtime || art.duration || '2h 30m');
    setFormYear(art.year || '2026');
    setFormCertificate(art.certificate || 'U/A 16+');
    setFormVerdict(art.verdict || 'MUST WATCH');
    setFormPros(art.positives ? art.positives.join(', ') : 'High octane action sequences, electrifying BGM');
    setFormCons(art.negatives ? art.negatives.join(', ') : 'Slightly stretched middle act');
    
    if (art.choiceOptions && art.choiceOptions.length > 0) {
      setChoiceOptions(art.choiceOptions.map((o: any) => (typeof o === 'string' ? o : o.text || '')));
    } else {
      setChoiceOptions(['Option 1', 'Option 2']);
    }
    setIsEditorOpen(true);
  };

  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      showToast('Please enter an article title');
      return;
    }
    if (!formSummary.trim()) {
      showToast('Please enter a 60-word feed summary');
      return;
    }

    setIsSaving(true);
    try {
      const generatedId = editingArticleId || `story-${Date.now()}`;
      
      const payload: Partial<ExtendedArticleData> & { id: string; title: string } = {
        id: generatedId,
        title: formTitle.trim(),
        type: formType,
        category: formCategory,
        summary: formSummary.trim(),
        fullContent: formFullContent.trim() || formSummary.trim(),
        featureImage: formFeatureImage,
        author: formAuthor.trim() || 'UPROLL Desk',
        status: formStatus,
        isPinned: formIsPinned,
        date: 'Just now',
        createdAt: Date.now(),
        genres: [formCategory, formType.toUpperCase()],
      };

      if (formType === 'movie_review') {
        payload.director = formDirector;
        payload.cast = formCast;
        payload.musicDirector = formMusicDirector;
        payload.cinematography = formCinematography;
        payload.runtime = formRuntime;
        payload.year = formYear;
        payload.certificate = formCertificate;
        payload.verdict = formVerdict;
        payload.positives = formPros.split(',').map((s) => s.trim()).filter(Boolean);
        payload.negatives = formCons.split(',').map((s) => s.trim()).filter(Boolean);
      }

      if (formType === 'poll' || formType === 'quiz') {
        payload.choiceOptions = choiceOptions.filter(o => o.trim()).map((text, idx) => ({
          id: String(idx + 1),
          text: text.trim(),
          votes: 0
        }));
        payload.badgeTag = formType === 'poll' ? 'LIVE FAN POLL' : 'TRIVIA QUIZ';
        payload.cardThemeColor = '#8B5CF6';
      }

      await publishArticle(payload);
      setIsEditorOpen(false);
      showToast(editingArticleId ? 'Story updated live!' : 'New story published live to mobile feed!');
    } catch (err) {
      console.error('Failed to save story:', err);
      showToast('Error saving to Firestore. Check console.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      try {
        await deleteArticleFromFirestore(id);
        showToast('Story removed from live feed');
      } catch (err) {
        console.error('Delete failed:', err);
        showToast('Failed to delete story');
      }
    }
  };

  const handleTogglePin = async (art: ExtendedArticleData) => {
    const nextPin = !art.isPinned;
    try {
      await updateArticleInFirestore(art.id, { isPinned: nextPin });
      showToast(nextPin ? 'Story pinned to top' : 'Story unpinned');
    } catch (err) {
      console.error('Pin toggle failed:', err);
    }
  };

  const handleToggleStatus = async (art: ExtendedArticleData) => {
    const nextStatus = art.status === 'Draft' ? 'Live' : 'Draft';
    try {
      await updateArticleInFirestore(art.id, { status: nextStatus });
      showToast(`Status changed to ${nextStatus}`);
    } catch (err) {
      console.error('Status toggle failed:', err);
    }
  };

  // Filtered articles
  const filteredArticles = articles.filter((art) => {
    const matchesSearch =
      art.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.category?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'All' || art.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Calculate summary stats
  const totalCount = articles.length;
  const liveCount = articles.filter((a) => a.status !== 'Draft').length;
  const pinnedCount = articles.filter((a) => a.isPinned).length;
  const pollsCount = articles.filter((a) => a.type === 'poll' || a.type === 'quiz').length;

  const wordCount = formSummary.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-6 font-sans text-slate-100 antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-sm shadow-2xl animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-slate-950 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Fast Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Firestore Live
            </span>
            <span className="text-slate-400 text-xs font-semibold">
              Realtime Sync Enabled
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1.5">
            UPROLL Content Studio
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Manage 60-word cinema cards, interactive polls, quizzes, and live stories
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileReader}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm border border-slate-700 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
          >
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>Open Mobile App</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm transition-all cursor-pointer shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Create Story</span>
          </button>
        </div>
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 my-6">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Total Stories</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">{totalCount}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">All created cards</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Live on App</span>
            <Flame className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-2">{liveCount}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">Active in reader stream</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Pinned to Top</span>
            <Pin className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 mt-2">{pinnedCount}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">Priority headliner cards</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Polls & Quizzes</span>
            <HelpCircle className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400 mt-2">{pollsCount}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">Interactive reader items</div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-5">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search headline, summary or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === 'All'
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All ({articles.length})
          </button>
          {CATEGORIES.map((cat) => {
            const count = articles.filter((a) => a.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Table / Cards */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800/90 overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-400 mb-3" />
            <p className="text-sm font-medium">Syncing stories from Cloud Firestore...</p>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <p className="text-base font-bold text-slate-300">No stories found</p>
            <p className="text-xs text-slate-500 mt-1">Try adjusting your search or category filter</p>
            <button
              onClick={handleOpenCreateModal}
              className="mt-4 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
            >
              + Create First Story
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/70">
            {filteredArticles.map((article, idx) => (
              <div
                key={article.id || idx}
                className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-800/40 transition-colors"
              >
                {/* Left: Thumbnail & Content Info */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  {/* Thumbnail */}
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-slate-700/60 shadow-xs">
                    <img
                      src={article.featureImage || PRESET_IMAGES[0].url}
                      alt={article.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    {article.isPinned && (
                      <div className="absolute top-1 left-1 p-1 rounded-md bg-amber-400 text-slate-950 font-black text-[9px] shadow-sm flex items-center gap-0.5">
                        <Pin className="w-2.5 h-2.5 fill-current" />
                      </div>
                    )}
                  </div>

                  {/* Text Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-extrabold uppercase border border-slate-700/60">
                        {article.category || 'Movies & TV'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                        article.type === 'poll'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                          : article.type === 'quiz'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                          : article.type === 'movie_review'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}>
                        {article.type || 'Standard'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                        article.status === 'Draft'
                          ? 'bg-slate-700 text-slate-300'
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {article.status || 'Live'}
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-white line-clamp-1">
                      {article.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                      {article.summary}
                    </p>

                    {/* Stats & Metadata */}
                    <div className="flex items-center gap-4 text-[11px] text-slate-500 font-medium mt-2">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3 text-slate-400" />
                        {article.opensCount || article.savedCount ? (article.opensCount || 1) * 120 + 340 : '420'} views
                      </span>
                      <span className="flex items-center gap-1">
                        <Bookmark className="w-3 h-3 text-slate-400" />
                        {article.savedCount || 8} saved
                      </span>
                      <span>By {article.author || 'Desk'}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Quick Action Buttons */}
                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                  {/* Pin Toggle */}
                  <button
                    onClick={() => handleTogglePin(article)}
                    title={article.isPinned ? 'Unpin from Top' : 'Pin to Top (Priority #1)'}
                    className={`p-2 rounded-xl transition-all cursor-pointer ${
                      article.isPinned
                        ? 'bg-amber-400 text-slate-950 shadow-md font-bold'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Pin className={`w-4 h-4 ${article.isPinned ? 'fill-current' : ''}`} />
                  </button>

                  {/* Status Toggle */}
                  <button
                    onClick={() => handleToggleStatus(article)}
                    title={`Click to set ${article.status === 'Draft' ? 'Live' : 'Draft'}`}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      article.status === 'Draft'
                        ? 'bg-slate-800 text-slate-400 hover:text-white'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                    }`}
                  >
                    {article.status === 'Draft' ? 'Draft' : 'Live'}
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => handleOpenEditModal(article)}
                    title="Edit Story"
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  {/* View in Reader */}
                  <button
                    onClick={() => {
                      if (onSelectArticleForReader) {
                        onSelectArticleForReader(article.id);
                      }
                      onOpenMobileReader();
                    }}
                    title="Preview in Mobile Reader"
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 transition-all cursor-pointer"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(article.id, article.title)}
                    title="Delete Story"
                    className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Minimal Story Editor Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-auto animate-fade-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Edit3 className="w-4 h-4" />
                </span>
                <h2 className="text-lg font-black text-white">
                  {editingArticleId ? 'Edit Story Card' : 'Create New 60-Word Story'}
                </h2>
              </div>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveArticle} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Content Format Type Selector */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                  Story Format
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'news', label: 'Article', icon: Film },
                    { id: 'poll', label: 'Radio Poll', icon: Radio },
                    { id: 'quiz', label: 'Quiz Trivia', icon: HelpCircle },
                    { id: 'movie_review', label: 'IMDb Review', icon: Bookmark },
                    { id: 'gallery', label: 'Full Gallery', icon: ImageIcon },
                  ].map((fmt) => {
                    const Icon = fmt.icon;
                    const isSelected = formType === fmt.id;
                    return (
                      <button
                        key={fmt.id}
                        type="button"
                        onClick={() => setFormType(fmt.id as any)}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Icon className="w-4 h-4 mb-1" />
                        <span>{fmt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title / Headline */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-300">
                    Story Headline / Title *
                  </label>
                  <span className={`text-[11px] font-mono font-bold ${formTitle.length > 70 ? 'text-amber-400' : 'text-slate-400'}`}>
                    {formTitle.length} / 80 chars
                  </span>
                </div>
                <input
                  type="text"
                  required
                  maxLength={80}
                  placeholder="e.g. 'ഖലീഫ' (Khalifa) Official Box Office & Teaser Update (Max 80 chars)"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Category & Author Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Author / Desk
                  </label>
                  <input
                    type="text"
                    value={formAuthor}
                    onChange={(e) => setFormAuthor(e.target.value)}
                    placeholder="UPROLL Desk"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Feed Card Summary - Standard Article Target (190 chars limit) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <label className="block text-xs font-bold text-slate-300">
                      Feed Card Summary *
                    </label>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
                      Limit: 190 chars
                    </span>
                  </div>
                  <span className={`text-[11px] font-extrabold ${formSummary.length > 170 ? 'text-amber-400' : 'text-slate-400'}`}>
                    {formSummary.length} / 190 chars • {wordCount} words
                  </span>
                </div>
                <textarea
                  required
                  rows={4}
                  maxLength={190}
                  value={formSummary}
                  onChange={(e) => setFormSummary(e.target.value)}
                  placeholder="Write feed card summary (Strict limit: 190 characters in Malayalam)..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500 leading-relaxed resize-y min-h-[110px]"
                />
              </div>

              {/* Full Article Content */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Full Article Body (shown when tapping 'Read Full Article')
                </label>
                <textarea
                  rows={4}
                  value={formFullContent}
                  onChange={(e) => setFormFullContent(e.target.value)}
                  placeholder="Detailed narrative, backstory, quotes, and analysis..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500 leading-relaxed"
                />
              </div>

              {/* Feature Image URL & Quick Cinema Presets */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Cover Image URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={formFeatureImage}
                    onChange={(e) => setFormFeatureImage(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                  {formFeatureImage && (
                    <img
                      src={formFeatureImage}
                      alt="preview"
                      className="w-10 h-10 rounded-xl object-cover border border-slate-700 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  )}
                </div>

                {/* Cinema Image Presets */}
                <div className="flex items-center gap-1.5 flex-wrap mt-2">
                  <span className="text-[11px] text-slate-500 font-semibold">Presets:</span>
                  {PRESET_IMAGES.map((img) => (
                    <button
                      key={img.label}
                      type="button"
                      onClick={() => setFormFeatureImage(img.url)}
                      className={`text-[10px] px-2 py-1 rounded-lg border font-semibold transition-all cursor-pointer ${
                        formFeatureImage === img.url
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {img.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Choice Options for Poll / Quiz */}
              {(formType === 'poll' || formType === 'quiz') && (
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-purple-500/30 space-y-2.5">
                  <label className="block text-xs font-black text-purple-300 uppercase tracking-wider">
                    Interactive Voting Options
                  </label>
                  {choiceOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 w-4">{idx + 1}.</span>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const next = [...choiceOptions];
                          next[idx] = e.target.value;
                          setChoiceOptions(next);
                        }}
                        placeholder={`Option ${idx + 1}`}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                      />
                      {choiceOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => setChoiceOptions(choiceOptions.filter((_, i) => i !== idx))}
                          className="p-1 text-slate-500 hover:text-rose-400"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                  {choiceOptions.length < 5 && (
                    <button
                      type="button"
                      onClick={() => setChoiceOptions([...choiceOptions, `Option ${choiceOptions.length + 1}`])}
                      className="text-xs text-purple-400 font-bold hover:underline"
                    >
                      + Add Another Choice
                    </button>
                  )}
                </div>
              )}

              {/* Movie Review Specification Fields (No Rating Stars) */}
              {formType === 'movie_review' && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <Film className="w-4 h-4 text-amber-400" />
                      Movie Review Specs & Credits
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                      No Rating Stars Mode
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">Director</label>
                      <input
                        type="text"
                        value={formDirector}
                        onChange={(e) => setFormDirector(e.target.value)}
                        placeholder="e.g. Vysakh"
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">Star Cast</label>
                      <input
                        type="text"
                        value={formCast}
                        onChange={(e) => setFormCast(e.target.value)}
                        placeholder="e.g. Unni Mukundan, Siddique"
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">Music & BGM</label>
                      <input
                        type="text"
                        value={formMusicDirector}
                        onChange={(e) => setFormMusicDirector(e.target.value)}
                        placeholder="e.g. Jakes Bejoy"
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">Cinematography</label>
                      <input
                        type="text"
                        value={formCinematography}
                        onChange={(e) => setFormCinematography(e.target.value)}
                        placeholder="e.g. Shaji Kumar"
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">Runtime</label>
                      <input
                        type="text"
                        value={formRuntime}
                        onChange={(e) => setFormRuntime(e.target.value)}
                        placeholder="e.g. 2h 30m"
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">Year</label>
                      <input
                        type="text"
                        value={formYear}
                        onChange={(e) => setFormYear(e.target.value)}
                        placeholder="e.g. 2026"
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">Certificate</label>
                      <input
                        type="text"
                        value={formCertificate}
                        onChange={(e) => setFormCertificate(e.target.value)}
                        placeholder="e.g. U/A 16+"
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">What Works / Highlights</label>
                      <input
                        type="text"
                        value={formPros}
                        onChange={(e) => setFormPros(e.target.value)}
                        placeholder="e.g. Mass intervals, Crisp sound"
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">Critique / Negatives</label>
                      <input
                        type="text"
                        value={formCons}
                        onChange={(e) => setFormCons(e.target.value)}
                        placeholder="e.g. Predictable second half"
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">Verdict</label>
                      <input
                        type="text"
                        value={formVerdict}
                        onChange={(e) => setFormVerdict(e.target.value)}
                        placeholder="e.g. MUST WATCH"
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Status & Priority Pin Row */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsPinned}
                      onChange={(e) => setFormIsPinned(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-500 focus:ring-0 bg-slate-900 border-slate-700"
                    />
                    <span className="text-xs font-bold text-white">Pin to Top Spot (#1)</span>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">Status:</span>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-bold text-white"
                  >
                    <option value="Live">Live</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow-lg cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>{editingArticleId ? 'Update Live Story' : 'Publish Live Now'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
