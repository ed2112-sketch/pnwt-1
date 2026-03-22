import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

interface TicketPdfProps {
  ticketNumber: string;
  eventTitle: string;
  eventDate: string;
  venueName: string;
  venueAddress: string;
  ticketTypeName: string;
  attendeeName: string;
  qrCodeDataUrl: string; // base64 from qrcode.toDataURL
}

const colors = {
  dark: "#1a1a2e",
  accent: "#16213e",
  highlight: "#0f3460",
  text: "#e0e0e0",
  white: "#ffffff",
  muted: "#94a3b8",
  border: "#334155",
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: colors.white,
    fontFamily: "Helvetica",
    flexDirection: "row",
  },
  leftPanel: {
    flex: 1,
    padding: 28,
    justifyContent: "space-between",
  },
  rightPanel: {
    width: 200,
    backgroundColor: colors.dark,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    backgroundColor: colors.dark,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginBottom: 20,
  },
  brandText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 2,
  },
  eventTitle: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: colors.dark,
    marginBottom: 8,
  },
  eventDate: {
    fontSize: 13,
    color: colors.highlight,
    fontFamily: "Helvetica-Bold",
    marginBottom: 16,
  },
  venueSection: {
    marginBottom: 16,
  },
  label: {
    fontSize: 8,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 3,
    fontFamily: "Helvetica-Bold",
  },
  venueName: {
    fontSize: 12,
    color: colors.dark,
    fontFamily: "Helvetica-Bold",
  },
  venueAddress: {
    fontSize: 10,
    color: "#64748b",
    marginTop: 2,
  },
  detailsRow: {
    flexDirection: "row",
    gap: 24,
    marginBottom: 16,
  },
  detailBlock: {
    flex: 1,
  },
  detailValue: {
    fontSize: 11,
    color: colors.dark,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 8,
  },
  footerText: {
    fontSize: 9,
    color: colors.muted,
    textAlign: "center",
  },
  qrCode: {
    width: 150,
    height: 150,
    marginBottom: 14,
  },
  ticketNumber: {
    color: colors.white,
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
    marginBottom: 6,
  },
  scanLabel: {
    color: colors.text,
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});

export function TicketPdfDocument(props: TicketPdfProps) {
  return (
    <Document title={`Ticket ${props.ticketNumber}`} author="PNWTickets">
      <TicketPage {...props} />
    </Document>
  );
}

export function TicketPage({
  ticketNumber,
  eventTitle,
  eventDate,
  venueName,
  venueAddress,
  ticketTypeName,
  attendeeName,
  qrCodeDataUrl,
}: TicketPdfProps) {
  return (
    <Page size="A5" orientation="landscape" style={styles.page}>
      <View style={styles.leftPanel}>
        <View>
          <View style={styles.header}>
            <Text style={styles.brandText}>PNWTICKETS</Text>
          </View>

          <Text style={styles.eventTitle}>{eventTitle}</Text>
          <Text style={styles.eventDate}>{eventDate}</Text>

          <View style={styles.venueSection}>
            <Text style={styles.label}>Venue</Text>
            <Text style={styles.venueName}>{venueName}</Text>
            {venueAddress ? (
              <Text style={styles.venueAddress}>{venueAddress}</Text>
            ) : null}
          </View>

          <View style={styles.detailsRow}>
            <View style={styles.detailBlock}>
              <Text style={styles.label}>Ticket Type</Text>
              <Text style={styles.detailValue}>{ticketTypeName}</Text>
            </View>
            <View style={styles.detailBlock}>
              <Text style={styles.label}>Attendee</Text>
              <Text style={styles.detailValue}>{attendeeName}</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Present this ticket at the door
          </Text>
        </View>
      </View>

      <View style={styles.rightPanel}>
        <Image style={styles.qrCode} src={qrCodeDataUrl} />
        <Text style={styles.ticketNumber}>{ticketNumber}</Text>
        <Text style={styles.scanLabel}>Scan to verify</Text>
      </View>
    </Page>
  );
}
