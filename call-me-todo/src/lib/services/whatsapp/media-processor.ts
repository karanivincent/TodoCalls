import type { SupabaseClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { WhatsAppAIHandler } from './ai-handler';
import type { ExtractedImageData } from '$lib/db/whatsapp-schema';

export interface MediaProcessResult {
  success: boolean;
  mediaId?: string;
  mediaType?: string;
  extractedText?: string;
  extractedTasks?: Array<{ title: string; dueDate?: string; priority?: string }>;
  receiptData?: { vendor: string; amount: number; date: string };
  contactData?: { name: string; company?: string; email?: string; phone?: string };
  error?: string;
}

export class WhatsAppMediaProcessor {
  private supabase: SupabaseClient;
  private aiHandler: WhatsAppAIHandler;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
    this.aiHandler = new WhatsAppAIHandler(supabase);
  }

  async processMedia(options: {
    userId: string | null;
    phoneNumber: string;
    mediaUrl: string;
    mediaContentType: string;
    caption?: string;
  }): Promise<MediaProcessResult> {
    const { userId, phoneNumber, mediaUrl, mediaContentType, caption } = options;

    try {
      console.log('📷 Processing media:', { mediaUrl, mediaContentType });

      // Determine media type
      const mediaType = this.getMediaType(mediaContentType);
      
      if (!['image', 'document'].includes(mediaType)) {
        return {
          success: false,
          error: `Unsupported media type: ${mediaType}. Please send images or documents.`,
        };
      }

      // Download media from Twilio
      const mediaData = await this.downloadMedia(mediaUrl);
      
      if (!mediaData) {
        return {
          success: false,
          error: 'Failed to download media. Please try again.',
        };
      }

      // Store media reference in database
      const { data: mediaRecord, error: dbError } = await this.supabase
        .from('whatsapp_media')
        .insert({
          user_id: userId,
          phone_number: phoneNumber,
          media_type: mediaType,
          media_url: mediaUrl,
          mime_type: mediaContentType,
          file_size: mediaData.size,
          processing_status: 'processing',
          category: 'other',
        })
        .select()
        .single();

      if (dbError || !mediaRecord) {
        console.error('Failed to store media record:', dbError);
        return {
          success: false,
          error: 'Failed to save media. Please try again.',
        };
      }

      // Process based on media type
      let result: MediaProcessResult;
      
      if (mediaType === 'image') {
        result = await this.processImage(mediaRecord.id, mediaData, caption);
      } else if (mediaType === 'document' && mediaContentType === 'application/pdf') {
        result = await this.processPDF(mediaRecord.id, mediaData);
      } else {
        result = await this.processDocument(mediaRecord.id, mediaData);
      }

      // Update media record with processing results
      await this.updateMediaRecord(mediaRecord.id, result);

      return {
        ...result,
        success: true,
        mediaId: mediaRecord.id,
        mediaType,
      };

    } catch (error) {
      console.error('Media processing error:', error);
      return {
        success: false,
        error: 'An error occurred while processing your media. Please try again.',
      };
    }
  }

  private async processImage(
    mediaId: string, 
    mediaData: any, 
    caption?: string
  ): Promise<MediaProcessResult> {
    try {
      // Perform OCR using external service (placeholder)
      const extractedText = await this.performOCR(mediaData);
      
      if (!extractedText) {
        return {
          success: true,
          extractedText: caption || '',
        };
      }

      // Analyze the image content
      const analysis = await this.aiHandler.analyzeImage('', extractedText);
      
      // Based on analysis type, extract specific data
      let result: MediaProcessResult = {
        success: true,
        extractedText,
      };

      switch (analysis.type) {
        case 'receipt':
          const receiptData = await this.aiHandler.extractReceiptData(extractedText);
          if (receiptData) {
            result.receiptData = receiptData;
          }
          break;

        case 'business_card':
          const contactData = await this.aiHandler.extractContactData(extractedText);
          if (contactData) {
            result.contactData = contactData;
          }
          break;

        case 'task_list':
          const tasks = await this.aiHandler.extractTasksFromText(extractedText);
          if (tasks.length > 0) {
            result.extractedTasks = tasks;
          }
          break;

        default:
          // Try to extract tasks from any text
          const genericTasks = await this.aiHandler.extractTasksFromText(extractedText);
          if (genericTasks.length > 0) {
            result.extractedTasks = genericTasks;
          }
      }

      return result;

    } catch (error) {
      console.error('Image processing error:', error);
      return {
        success: false,
        error: 'Failed to process image',
      };
    }
  }

  private async processPDF(mediaId: string, mediaData: any): Promise<MediaProcessResult> {
    // Placeholder for PDF processing
    // In production, you would use a PDF parsing library
    return {
      success: true,
      extractedText: 'PDF processing not yet implemented',
    };
  }

  private async processDocument(mediaId: string, mediaData: any): Promise<MediaProcessResult> {
    // Placeholder for general document processing
    return {
      success: true,
      extractedText: 'Document processing not yet implemented',
    };
  }

  private async performOCR(mediaData: any): Promise<string | null> {
    // Placeholder for OCR
    // In production, you would use services like:
    // - Google Cloud Vision API
    // - Azure Computer Vision
    // - AWS Textract
    // - Tesseract.js
    
    // For now, return mock data for testing
    if (env.NODE_ENV === 'development') {
      return 'Sample extracted text from image';
    }

    return null;
  }

  private async downloadMedia(mediaUrl: string): Promise<any> {
    try {
      // Download media from Twilio URL
      // Note: Twilio media URLs require authentication
      const response = await fetch(mediaUrl, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString('base64')}`,
        },
      });

      if (!response.ok) {
        console.error('Failed to download media:', response.status);
        return null;
      }

      const buffer = await response.arrayBuffer();
      return {
        data: buffer,
        size: buffer.byteLength,
        contentType: response.headers.get('content-type'),
      };

    } catch (error) {
      console.error('Media download error:', error);
      return null;
    }
  }

  private async updateMediaRecord(mediaId: string, result: MediaProcessResult): Promise<void> {
    const extractedData: ExtractedImageData = {
      type: 'other',
      confidence: 0.8,
      rawText: result.extractedText,
    };

    if (result.extractedTasks) {
      extractedData.type = 'task_list';
      extractedData.extractedTasks = result.extractedTasks;
    } else if (result.receiptData) {
      extractedData.type = 'receipt';
      extractedData.receiptData = result.receiptData;
    } else if (result.contactData) {
      extractedData.type = 'business_card';
      extractedData.contactData = result.contactData;
    }

    await this.supabase
      .from('whatsapp_media')
      .update({
        extracted_text: result.extractedText,
        extracted_data: extractedData,
        processing_status: result.success ? 'completed' : 'failed',
        processing_error: result.error,
        processed_at: new Date().toISOString(),
        category: extractedData.type,
      })
      .eq('id', mediaId);
  }

  private getMediaType(contentType: string): string {
    if (contentType.startsWith('image/')) return 'image';
    if (contentType.startsWith('audio/')) return 'audio';
    if (contentType.startsWith('video/')) return 'video';
    if (contentType.includes('pdf')) return 'document';
    if (contentType.startsWith('application/')) return 'document';
    return 'other';
  }

  async getMediaById(mediaId: string): Promise<any> {
    const { data, error } = await this.supabase
      .from('whatsapp_media')
      .select('*')
      .eq('id', mediaId)
      .single();

    if (error) {
      console.error('Failed to get media:', error);
      return null;
    }

    return data;
  }

  async getUserMedia(userId: string, limit: number = 10): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('whatsapp_media')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to get user media:', error);
      return [];
    }

    return data || [];
  }

  async searchMedia(userId: string, query: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('whatsapp_media')
      .select('*')
      .eq('user_id', userId)
      .or(`extracted_text.ilike.%${query}%,category.eq.${query}`)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Failed to search media:', error);
      return [];
    }

    return data || [];
  }
}