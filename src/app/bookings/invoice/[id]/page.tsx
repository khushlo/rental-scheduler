"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Download, Share2, ArrowLeft, Loader2 } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  InvoiceHTMLComponent,
  generatePDFTemplate,
  generateInvoiceData,
  generatePDFFilename,
} from "@/components/invoice";
import type { Booking, BookingItem } from "@/components/invoice/types";
import { apiGet } from "@/lib/api-client";

export default function InvoicePage() {
  const params = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  const bookingId = params.id;

  useEffect(() => {
    if (bookingId) {
      fetchBooking();
    }
  }, [bookingId]);

  const fetchBooking = async () => {
    try {
      setLoading(true);
      const response = await apiGet(`/api/bookings/${bookingId}`);
      if (response.ok) {
        const data = await response.json();
        setBooking(data);
      } else {
        console.error("Failed to fetch booking");
        router.push("/bookings");
      }
    } catch (error: any) {
      console.error("Error fetching booking:", error);
      if (error.status === 401) {
        // Handled by API client
        return;
      }
      router.push("/bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAsPDF = async () => {
    if (!invoiceRef.current || !booking) return;

    let tempContainer: HTMLDivElement | null = null;

    try {
      setIsGeneratingPDF(true);

      // Create a temporary container with fixed dimensions for consistent PDF output
      tempContainer = document.createElement("div");
      tempContainer.style.position = "absolute";
      tempContainer.style.left = "-9999px";
      tempContainer.style.top = "0";
      tempContainer.style.width = "794px"; // A4 width in pixels at 96 DPI
      tempContainer.style.minHeight = "1123px"; // A4 height in pixels
      tempContainer.style.backgroundColor = "white";
      tempContainer.style.fontFamily = "Arial, sans-serif";
      tempContainer.style.padding = "40px";
      tempContainer.style.boxSizing = "border-box";

      // Generate invoice data with tenant information
      const invoiceData = generateInvoiceData(booking, booking.tenant);

      // Generate PDF template
      tempContainer.innerHTML = generatePDFTemplate({ invoiceData });

      document.body.appendChild(tempContainer);

      // Wait a bit for fonts and styles to load
      await new Promise((resolve) => setTimeout(resolve, 100));

      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        width: 794,
        height: Math.max(1123, tempContainer.scrollHeight + 80),
        scrollX: 0,
        scrollY: 0,
      });

      // Clean up
      document.body.removeChild(tempContainer);

      const imgData = canvas.toDataURL("image/png", 1.0);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      // Calculate dimensions to fit the page properly
      const ratio = Math.min(
        pdfWidth / (imgWidth * 0.264583),
        pdfHeight / (imgHeight * 0.264583)
      );
      const finalWidth = imgWidth * 0.264583 * ratio;
      const finalHeight = imgHeight * 0.264583 * ratio;

      // Center the content
      const xPos = (pdfWidth - finalWidth) / 2;
      const yPos = 10; // Small margin from top

      pdf.addImage(
        imgData,
        "PNG",
        xPos,
        yPos,
        finalWidth,
        finalHeight,
        undefined,
        "FAST"
      );

      // Generate filename
      const fileName = generatePDFFilename(booking);

      // Simply save the PDF without auto-opening
      pdf.save(fileName);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please try again.");
    } finally {
      // Cleanup
      if (tempContainer && tempContainer.parentNode) {
        tempContainer.parentNode.removeChild(tempContainer);
      }
      setIsGeneratingPDF(false);
    }
  };

  const handleShare = async () => {
    if (!invoiceRef.current || !booking) return;

    let tempContainer: HTMLDivElement | null = null;

    try {
      setIsSharing(true);

      // Create a temporary container with fixed dimensions for consistent PDF output
      tempContainer = document.createElement("div");
      tempContainer.style.position = "absolute";
      tempContainer.style.left = "-9999px";
      tempContainer.style.top = "0";
      tempContainer.style.width = "794px"; // A4 width in pixels at 96 DPI
      tempContainer.style.minHeight = "1123px"; // A4 height in pixels
      tempContainer.style.backgroundColor = "white";
      tempContainer.style.fontFamily = "Arial, sans-serif";
      tempContainer.style.padding = "40px";
      tempContainer.style.boxSizing = "border-box";

      // Generate invoice data with tenant information
      const invoiceData = generateInvoiceData(booking, booking.tenant);

      // Generate PDF template
      tempContainer.innerHTML = generatePDFTemplate({ invoiceData });

      document.body.appendChild(tempContainer);

      // Wait a bit for fonts and styles to load
      await new Promise((resolve) => setTimeout(resolve, 100));

      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        width: 794,
        height: Math.max(1123, tempContainer.scrollHeight + 80),
        scrollX: 0,
        scrollY: 0,
      });

      // Clean up
      document.body.removeChild(tempContainer);

      const imgData = canvas.toDataURL("image/png", 1.0);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      // Calculate dimensions to fit the page properly
      const ratio = Math.min(
        pdfWidth / (imgWidth * 0.264583),
        pdfHeight / (imgHeight * 0.264583)
      );
      const finalWidth = imgWidth * 0.264583 * ratio;
      const finalHeight = imgHeight * 0.264583 * ratio;

      // Center the content
      const xPos = (pdfWidth - finalWidth) / 2;
      const yPos = 10; // Small margin from top

      pdf.addImage(
        imgData,
        "PNG",
        xPos,
        yPos,
        finalWidth,
        finalHeight,
        undefined,
        "FAST"
      );

      const pdfBlob = pdf.output("blob");

      // Generate filename
      const fileName = generatePDFFilename(booking);

      // Create a downloadable URL for the PDF
      const pdfUrl = URL.createObjectURL(pdfBlob);

      // Check if running on mobile device
      const isMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );

      // Try Web Share API first (works on newer mobile browsers)
      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({
          files: [new File([pdfBlob], fileName, { type: "application/pdf" })],
        })
      ) {
        try {
          const file = new File([pdfBlob], fileName, {
            type: "application/pdf",
          });

          await navigator.share({
            title: `Invoice ${invoiceData.invoiceNumber} - ${invoiceData.storeName}`,
            text: `Invoice for ${
              booking.customer.name
            } - Total: ₹${booking.totalAmount.toLocaleString()}`,
            files: [file],
          });
          return;
        } catch (shareError) {
          console.log(
            "Web Share API failed, falling back to download and open"
          );
        }
      }

      // Fallback: Download and open PDF for manual sharing
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Auto-open the PDF after a short delay (to allow download to complete)
      setTimeout(() => {
        if (isMobile) {
          // On mobile, try to open the PDF directly
          try {
            window.open(pdfUrl, "_blank");
          } catch (error) {
            console.log("Could not auto-open PDF on mobile");
          }

          // Show helpful message for mobile users
          alert(
            "📱 PDF downloaded and opened!\n\n💡 Tip: You can now use your device's share button to send this invoice via WhatsApp, Email, Telegram, or any other app."
          );
        } else {
          // On desktop, open PDF in new tab
          window.open(pdfUrl, "_blank");
          alert(
            "📄 PDF downloaded and opened in new tab!\n\n💡 Tip: You can now save or share this PDF from the new tab."
          );
        }
      }, 500); // Small delay to ensure download starts first

      // Cleanup URL after a delay
      setTimeout(() => {
        URL.revokeObjectURL(pdfUrl);
      }, 10000);
    } catch (error) {
      console.error("Error sharing PDF:", error);
      alert("Error generating PDF for sharing. Please try again.");
    } finally {
      // Cleanup
      if (tempContainer && tempContainer.parentNode) {
        tempContainer.parentNode.removeChild(tempContainer);
      }
      setIsSharing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading invoice...</span>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Booking Not Found
          </h1>
          <p className="text-gray-600 mb-4">
            The requested booking could not be found.
          </p>
          <button
            onClick={() => router.push("/bookings")}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Bookings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header Actions */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push("/bookings")}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Bookings
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveAsPDF}
              disabled={isGeneratingPDF}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {isGeneratingPDF ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Save as PDF
            </button>

            <button
              onClick={handleShare}
              disabled={isSharing}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {isSharing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
              Share
            </button>
          </div>
        </div>

        {/* Invoice Content */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div ref={invoiceRef} className="p-4 sm:p-6 lg:p-8">
            <InvoiceHTMLComponent
              invoiceData={generateInvoiceData(booking, booking.tenant)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
