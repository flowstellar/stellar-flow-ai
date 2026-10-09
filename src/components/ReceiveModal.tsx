import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Copy } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { toast } from '@/hooks/use-toast';
import QRCode from 'react-qr-code';

interface ReceiveModalProps {
  open: boolean;
  onClose: () => void;
}

const ReceiveModal = ({ open, onClose }: ReceiveModalProps) => {
  const { wallet } = useWallet();
  const address = wallet?.publicKey || '';

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    toast({ title: 'Copied!', description: 'Wallet address copied' });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-card border-border/50 max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-foreground">Receive Payment</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground text-center">
            Scan the QR code or copy your wallet address to receive funds.
          </DialogDescription>
        </DialogHeader>
        {wallet ? (
          <div className="flex flex-col items-center gap-5 py-4">
            <div className="bg-foreground p-4 rounded-2xl">
              <QRCode value={address} size={180} bgColor="hsl(0 0% 95%)" fgColor="hsl(260 20% 6%)" />
            </div>
            <div className="w-full">
              <p className="text-xs text-muted-foreground mb-2 text-center">Your Wallet Address</p>
              <button onClick={copyAddress}
                className="w-full glass-card p-3 flex items-center justify-between hover:bg-secondary/50 transition-colors">
                <span className="font-mono text-[10px] text-foreground truncate">{address}</span>
                <Copy className="w-4 h-4 text-muted-foreground shrink-0 ml-2" />
              </button>
            </div>
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground py-8">Create or import a wallet first</p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ReceiveModal;
