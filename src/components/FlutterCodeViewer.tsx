import React, { useState } from 'react';
import { Code2, Copy, Check, X, FileCode, Download, ExternalLink, Sparkles } from 'lucide-react';

interface FlutterFile {
  name: string;
  path: string;
  language: string;
  code: string;
}

const FLUTTER_FILES: FlutterFile[] = [
  {
    name: 'feed_reader_screen.dart',
    path: 'lib/screens/feed_reader_screen.dart',
    language: 'dart',
    code: `import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/models.dart';
import '../services/firestore_news_service.dart';

/// UPROLL - Mobile Cinema News Feed & Short Stories Screen
/// 60-Word Card Swipe Architecture with Polls, Quizzes, and IMDb Reviews
class FeedReaderScreen extends StatefulWidget {
  const FeedReaderScreen({super.key});

  @override
  State<FeedReaderScreen> createState() => _FeedReaderScreenState();
}

class _FeedReaderScreenState extends State<FeedReaderScreen> {
  final PageController _pageController = PageController();
  int _currentIndex = 0;
  String _selectedCategory = 'All';

  @override
  Widget build(BuildContext context) {
    final newsService = context.watch<FirestoreNewsService>();

    return Scaffold(
      backgroundColor: const Color(0xFF070A10),
      body: SafeArea(
        child: Column(
          children: [
            // Top Category Chips Bar
            Container(
              height: 48,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: ListView(
                scrollDirection: Axis.horizontal,
                children: [
                  _buildCategoryChip('All'),
                  _buildCategoryChip('Movies & TV Shows'),
                  _buildCategoryChip('Celebrity'),
                  _buildCategoryChip('Box Office'),
                  _buildCategoryChip('Reviews'),
                ],
              ),
            ),

            // Vertical PageView for Short Story Cards
            Expanded(
              child: PageView.builder(
                controller: _pageController,
                scrollDirection: Axis.vertical,
                itemCount: newsService.articles.length,
                onPageChanged: (index) => setState(() => _currentIndex = index),
                itemBuilder: (context, index) {
                  final article = newsService.articles[index];
                  return _buildNewsCard(article);
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCategoryChip(String title) {
    final isSelected = _selectedCategory == title;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
      child: ChoiceChip(
        label: Text(title, style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: isSelected ? Colors.black : Colors.white70)),
        selected: isSelected,
        selectedColor: const Color(0xFFA2D5B1),
        backgroundColor: const Color(0xFF1E242B),
        onSelected: (val) => setState(() => _selectedCategory = title),
      ),
    );
  }

  Widget _buildNewsCard(Article article) {
    return Container(
      margin: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Cover Image
          ClipRRect(
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
            child: Image.network(
              article.featureImage,
              height: 220,
              width: double.infinity,
              fit: BoxFit.cover,
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  article.title,
                  style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Text(
                  article.summary,
                  style: const TextStyle(color: Colors.white70, fontSize: 13, height: 1.4),
                  maxLines: 4,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
`,
  },
  {
    name: 'models.dart',
    path: 'lib/models/models.dart',
    language: 'dart',
    code: `// Data models for UPROLL Content Management System

enum ContentType { standard, gallery, poll, quiz, movieReview }
enum UserRole { admin, editor, creator }

class Article {
  final String id;
  final String title;
  final ContentType type;
  final String category;
  final String author;
  final String date;
  final int views;
  final int bookmarks;
  final int shares;
  final String status;
  final int? pinPosition; // 1 to 20 or null
  final String summary;
  final String fullContent;
  final String featureImage;
  final bool pushNotification;
  final List<String>? galleryImages;
  final String? pollQuestion;
  final List<PollOption>? pollOptions;
  final String? correctOptionId;
  final MovieReview? movieReview;

  Article({
    required this.id,
    required this.title,
    required this.type,
    required this.category,
    required this.author,
    required this.date,
    required this.views,
    required this.bookmarks,
    required this.shares,
    required this.status,
    this.pinPosition,
    required this.summary,
    required this.fullContent,
    required this.featureImage,
    required this.pushNotification,
    this.galleryImages,
    this.pollQuestion,
    this.pollOptions,
    this.correctOptionId,
    this.movieReview,
  });

  Map<String, dynamic> toFirestore() {
    return {
      'title': title,
      'type': type.name,
      'category': category,
      'author': author,
      'date': date,
      'views': views,
      'bookmarks': bookmarks,
      'shares': shares,
      'status': status,
      'pinPosition': pinPosition,
      'summary': summary,
      'fullContent': fullContent,
      'featureImage': featureImage,
      'pushNotification': pushNotification,
      'galleryImages': galleryImages,
      'pollQuestion': pollQuestion,
      'pollOptions': pollOptions?.map((o) => o.toMap()).toList(),
      'correctOptionId': correctOptionId,
      'movieReview': movieReview?.toMap(),
    };
  }
}

class PollOption {
  final String id;
  final String text;
  final int votes;

  PollOption({required this.id, required this.text, required this.votes});

  Map<String, dynamic> toMap() => {'id': id, 'text': text, 'votes': votes};
}

class MovieReview {
  final List<String> cast;
  final String director;
  final List<String> genres;
  final double imdbScore;
  final String backdropUrl;
  final String synopsis;

  MovieReview({
    required this.cast,
    required this.director,
    required this.genres,
    required this.imdbScore,
    required this.backdropUrl,
    required this.synopsis,
  });

  Map<String, dynamic> toMap() => {
    'cast': cast,
    'director': director,
    'genres': genres,
    'imdbScore': imdbScore,
    'backdropUrl': backdropUrl,
    'synopsis': synopsis,
  };
}
`,
  },
  {
    name: 'firestore_news_service.dart',
    path: 'lib/services/firestore_news_service.dart',
    language: 'dart',
    code: `import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';
import '../models/models.dart';

/// Cloud Firestore News Feed Service for UPROLL
class FirestoreNewsService with ChangeNotifier {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  List<Article> _articles = [];
  bool _isLoading = false;

  List<Article> get articles => _articles;
  bool get isLoading => _isLoading;

  CollectionReference get _articlesRef => _firestore.collection('articles');

  FirestoreNewsService() {
    _initStream();
  }

  void _initStream() {
    _isLoading = true;
    _articlesRef.orderBy('createdAt', descending: true).snapshots().listen((snapshot) {
      _articles = snapshot.docs.map((doc) {
        final data = doc.data() as Map<String, dynamic>;
        return Article(
          id: doc.id,
          title: data['title'] ?? '',
          type: ContentType.values.firstWhere((e) => e.name == data['type'], orElse: () => ContentType.standard),
          category: data['category'] ?? 'General',
          author: data['author'] ?? 'Admin',
          date: data['date'] ?? 'Today',
          views: data['views'] ?? 0,
          bookmarks: data['bookmarks'] ?? 0,
          shares: data['shares'] ?? 0,
          status: data['status'] ?? 'Live',
          pinPosition: data['pinPosition'],
          summary: data['summary'] ?? '',
          fullContent: data['fullContent'] ?? '',
          featureImage: data['featureImage'] ?? '',
          pushNotification: data['pushNotification'] ?? false,
        );
      }).toList();
      _isLoading = false;
      notifyListeners();
    });
  }
}
`,
  },
];

interface FlutterCodeViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FlutterCodeViewer: React.FC<FlutterCodeViewerProps> = ({ isOpen, onClose }) => {
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentFile = FLUTTER_FILES[activeFileIndex];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([currentFile.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = currentFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 lg:p-8 animate-fade-in">
      <div className="bg-[#0F172A] border border-slate-700 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden text-white">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#1E293B]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Flutter Architecture & Source Code</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Material 3 • Provider
                </span>
              </h2>
              <p className="text-xs text-slate-400">Production-ready Flutter Web/Desktop & Mobile source files</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer text-slate-200"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer text-slate-200"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* File Tabs */}
        <div className="flex items-center gap-1 px-4 py-2 bg-[#0B0F19] border-b border-slate-800 overflow-x-auto">
          {FLUTTER_FILES.map((file, idx) => (
            <button
              key={file.name}
              onClick={() => setActiveFileIndex(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
                activeFileIndex === idx
                  ? 'bg-[#1E293B] text-blue-400 border border-slate-700 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>{file.name}</span>
            </button>
          ))}
        </div>

        {/* Code Editor Preview */}
        <div className="flex-1 overflow-auto p-6 bg-[#090D16] font-mono text-xs text-slate-300 leading-relaxed select-text">
          <pre className="whitespace-pre">
            <code>{currentFile.code}</code>
          </pre>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-[#0B0F19] flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <span>Path:</span>
            <code className="text-slate-400">{currentFile.path}</code>
          </div>
          <span>Dart 3.0+ & Flutter 3.19+ Compatible</span>
        </div>
      </div>
    </div>
  );
};
