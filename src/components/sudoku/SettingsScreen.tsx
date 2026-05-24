'use client';

import React from 'react';
import { useSudokuStore } from '@/lib/sudoku-store';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sun, Moon, Highlighter, Pencil, Volume2, VolumeX, AlertTriangle, Clock, Eye, EyeOff, Music, Music2, User, CheckCircle, LogOut, LogIn, CloudOff } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { isSupabaseConfigured } from '@/lib/supabase';

const SettingsScreen: React.FC = () => {
  const setScreen = useSudokuStore((s) => s.setScreen);
  const settings = useSudokuStore((s) => s.settings);
  const updateSettings = useSudokuStore((s) => s.updateSettings);
  const cheatSolve = useSudokuStore((s) => s.cheatSolve);
  const board = useSudokuStore((s) => s.board);
  const isComplete = useSudokuStore((s) => s.isComplete);
  const user = useSudokuStore((s) => s.user);
  const isAuthLoading = useSudokuStore((s) => s.isAuthLoading);
  const signOut = useSudokuStore((s) => s.signOut);

  const toggleTheme = () => {
    const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
    updateSettings({ theme: newTheme });

    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleCheatSolve = () => {
    if (board && board.length > 0 && !isComplete) {
      cheatSolve();
      toast({
        title: '🧙‍♂️ Cheat activated!',
        description: 'The puzzle has been solved for you.',
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen safe-bottom">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 sm:p-4 glass-card border-b border-white/10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setScreen('home')}
          className="h-9 w-9 rounded-lg hover:bg-white/10"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-lg font-bold">Settings</h1>
          <p className="text-xs text-muted-foreground">Customize your experience</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 sm:space-y-6">
        {/* Appearance */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Appearance
          </h2>
          <div className="glass-card rounded-xl divide-y divide-white/10">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {settings.theme === 'dark' ? <Moon className="w-5 h-5 text-cyan-400" /> : <Sun className="w-5 h-5 text-amber-400" />}
                <div>
                  <Label className="font-medium">Dark Mode</Label>
                  <p className="text-xs text-muted-foreground">Toggle dark/light theme</p>
                </div>
              </div>
              <Switch
                checked={settings.theme === 'dark'}
                onCheckedChange={toggleTheme}
              />
            </div>
          </div>
        </div>

        {/* Gameplay */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Gameplay
          </h2>
          <div className="glass-card rounded-xl divide-y divide-white/10">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Highlighter className="w-5 h-5 text-cyan-400" />
                <div>
                  <Label className="font-medium">Highlight Same Numbers</Label>
                  <p className="text-xs text-muted-foreground">Highlight cells with the same number</p>
                </div>
              </div>
              <Switch
                checked={settings.highlightSameNumbers}
                onCheckedChange={(checked) => updateSettings({ highlightSameNumbers: checked })}
              />
            </div>

            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <div>
                  <Label className="font-medium">Highlight Conflicts</Label>
                  <p className="text-xs text-muted-foreground">Show errors in real-time</p>
                </div>
              </div>
              <Switch
                checked={settings.highlightConflicts}
                onCheckedChange={(checked) => updateSettings({ highlightConflicts: checked })}
              />
            </div>

            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Pencil className="w-5 h-5 text-purple-400" />
                <div>
                  <Label className="font-medium">Auto-Fill Notes</Label>
                  <p className="text-xs text-muted-foreground">Automatically fill possible pencil marks</p>
                </div>
              </div>
              <Switch
                checked={settings.autoNotes}
                onCheckedChange={(checked) => updateSettings({ autoNotes: checked })}
              />
            </div>

            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-amber-400" />
                <div>
                  <Label className="font-medium">Show Timer</Label>
                  <p className="text-xs text-muted-foreground">Display the game timer</p>
                </div>
              </div>
              <Switch
                checked={settings.showTimer}
                onCheckedChange={(checked) => updateSettings({ showTimer: checked })}
              />
            </div>

            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
                <div>
                  <Label className="font-medium">Mistake Limit</Label>
                  <p className="text-xs text-muted-foreground">Game over after this many mistakes</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {[1, 3, 5].map((limit) => (
                  <button
                    key={limit}
                    onClick={() => updateSettings({ mistakeLimit: limit })}
                    className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${
                      settings.mistakeLimit === limit
                        ? 'bg-cyan-500/30 text-cyan-400 ring-1 ring-cyan-400/50'
                        : 'bg-white/5 text-muted-foreground hover:bg-white/10'
                    }`}
                  >
                    {limit}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sound */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Sound
          </h2>
          <div className="glass-card rounded-xl divide-y divide-white/10">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {settings.soundEnabled ? <Volume2 className="w-5 h-5 text-emerald-400" /> : <VolumeX className="w-5 h-5 text-muted-foreground" />}
                <div>
                  <Label className="font-medium">Sound Effects</Label>
                  <p className="text-xs text-muted-foreground">Play sounds on interactions</p>
                </div>
              </div>
              <Switch
                checked={settings.soundEnabled}
                onCheckedChange={(checked) => updateSettings({ soundEnabled: checked })}
              />
            </div>
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {settings.bgMusicEnabled ? <Music2 className="w-5 h-5 text-purple-400" /> : <Music className="w-5 h-5 text-muted-foreground" />}
                <div>
                  <Label className="font-medium">Background Music</Label>
                  <p className="text-xs text-muted-foreground">Ambient music while playing</p>
                </div>
              </div>
              <Switch
                checked={settings.bgMusicEnabled}
                onCheckedChange={(checked) => updateSettings({ bgMusicEnabled: checked })}
              />
            </div>
          </div>
        </div>

        {/* Account */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Account
          </h2>
          <div className="glass-card rounded-xl divide-y divide-white/10">
            {isAuthLoading ? (
              <div className="p-4 flex items-center gap-3">
                <User className="w-5 h-5 text-muted-foreground animate-pulse" />
                <div>
                  <Label className="font-medium">Loading…</Label>
                  <p className="text-xs text-muted-foreground">Checking authentication status</p>
                </div>
              </div>
            ) : user ? (
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-cyan-500/20 flex items-center justify-center">
                    <User className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Label className="font-medium truncate block">{user.email}</Label>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-xs text-emerald-400 font-medium">Signed in</span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    await signOut();
                    toast({ title: 'Signed out', description: 'You have been signed out.' });
                  }}
                  className="text-red-400 hover:bg-red-500/10 hover:text-red-400"
                >
                  <LogOut className="w-4 h-4 mr-1.5" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <Label className="font-medium">Not signed in</Label>
                    <p className="text-xs text-muted-foreground">Sign in to sync your progress</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setScreen('auth')}
                  className="text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-400"
                >
                  <LogIn className="w-4 h-4 mr-1.5" />
                  Sign In
                </Button>
              </div>
            )}
            {!isSupabaseConfigured() && (
              <div className="p-3 flex items-center gap-2 bg-amber-500/5 rounded-b-xl">
                <CloudOff className="w-4 h-4 text-amber-500 shrink-0" />
                <p className="text-xs text-amber-500/80">Cloud sync isn't configured. Set up Supabase to enable account features.</p>
              </div>
            )}
          </div>
        </div>

        {/* Developer */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Developer
          </h2>
          <div className="glass-card rounded-xl">
            <div className="p-4">
              <Button
                variant="ghost"
                onClick={handleCheatSolve}
                disabled={!board || board.length === 0 || isComplete}
                className="w-full hover:bg-red-500/10 text-red-400 justify-start"
              >
                <Eye className="w-4 h-4 mr-2" />
                Solve Puzzle (Cheat)
              </Button>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="text-center text-xs text-muted-foreground/50 pb-4">
          <p>Sudoku v1.0</p>
          <p>Built with Next.js & Tailwind CSS</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;
