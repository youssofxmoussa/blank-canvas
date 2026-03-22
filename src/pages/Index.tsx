import { useState, useRef, useCallback } from "react";
import { extractTextFromImage, fileToBase64 } from "@/lib/groq";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload, Copy, ImageIcon, Loader2, X, Sparkles } from "lucide-react";

const Index = () => {
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image file.", variant: "destructive" });
      return;
    }
    const url = URL.createObjectURL(file);
    setImage(url);
    setImageFile(file);
    setExtractedText("");
  }, [toast]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const extract = async () => {
    if (!imageFile) return;
    setLoading(true);
    try {
      const { base64, mimeType } = await fileToBase64(imageFile);
      const text = await extractTextFromImage(base64, mimeType);
      setExtractedText(text);
    } catch (err: any) {
      toast({ title: "Extraction failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copyText = () => {
    navigator.clipboard.writeText(extractedText);
    toast({ title: "Copied to clipboard" });
  };

  const clear = () => {
    setImage(null);
    setImageFile(null);
    setExtractedText("");
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:py-20">
        {/* Header */}
        <header className="mb-10 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium tracking-wide text-muted-foreground">
            <Sparkles className="h-3 w-3" /> Powered by Llama 4 Scout
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ lineHeight: 1.1 }}>
            Image Text Extractor
          </h1>
          <p className="mt-3 text-muted-foreground text-sm max-w-md mx-auto text-wrap-pretty">
            Upload an image and extract text using Groq's vision model. Supports photos, screenshots, documents.
          </p>
        </header>

        {/* Upload zone */}
        <Card
          className={`relative cursor-pointer border-2 border-dashed transition-colors duration-200 ${
            dragOver ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/40"
          } ${image ? "p-0 overflow-hidden" : "p-10"}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => !image && fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />

          {image ? (
            <div className="relative">
              <img src={image} alt="Uploaded" className="w-full max-h-80 object-contain bg-muted/30" />
              <Button
                size="icon"
                variant="secondary"
                className="absolute right-2 top-2 h-7 w-7 rounded-full shadow-md"
                onClick={(e) => { e.stopPropagation(); clear(); }}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <div className="rounded-xl border border-border bg-background p-3 shadow-sm">
                <ImageIcon className="h-6 w-6" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">Drop image here or click to browse</p>
                <p className="mt-1 text-xs">PNG, JPG, WEBP up to 20MB</p>
              </div>
            </div>
          )}
        </Card>

        {/* Extract button */}
        {image && (
          <div className="mt-4 flex gap-2">
            <Button onClick={extract} disabled={loading} className="flex-1 active:scale-[0.97] transition-transform">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Extracting…
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Extract Text
                </>
              )}
            </Button>
          </div>
        )}

        {/* Result */}
        {extractedText && (
          <div className="mt-6 animate-in fade-in slide-in-from-bottom-3 duration-500">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Extracted Text</span>
              <Button variant="ghost" size="sm" onClick={copyText} className="h-7 text-xs active:scale-95 transition-transform">
                <Copy className="mr-1.5 h-3 w-3" /> Copy
              </Button>
            </div>
            <Textarea
              value={extractedText}
              readOnly
              className="min-h-[160px] resize-y bg-muted/30 font-mono text-sm"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
