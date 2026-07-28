import {
  Server, Database, Cloud, Network, Cpu, HardDrive, Workflow, Activity, BarChart3, Box,
  Shield, Key, BrainCircuit, Bot, Globe, Mail, MessageSquare, CreditCard,
  TerminalSquare, Layers, Lock, Clock, Zap, Search, Fingerprint, LineChart, FileText
} from 'lucide-react';
import type { Vendor } from '../../types/registry';

interface ComponentIconRendererProps {
  type: string;
  vendor?: Vendor;
  size?: number;
  className?: string;
}

export function ComponentIconRenderer({ type, size = 20, className = '' }: ComponentIconRendererProps) {
  const iconProps = {
    width: size,
    height: size,
    className: `${className} text-slate-300`,
  };

  const Icon = getIconComponent(type);

  return (
    <div className="p-1.5 rounded bg-white/[0.03] border border-white/10 shadow-sm flex items-center justify-center">
      <Icon {...iconProps} />
    </div>
  );
}

function getIconComponent(type: string) {
  if (type.includes('gpu')) return Zap;
  if (type.includes('function') || type.includes('lambda')) return Cpu;
  if (type.includes('container') || type.includes('worker') || type.includes('job')) return Box;
  if (type.includes('vm')) return Server;

  if (type.includes('dns') || type.includes('cdn')) return Globe;
  if (type.includes('gateway') || type.includes('proxy') || type.includes('balancer') || type.includes('ingress') || type.includes('egress') || type.includes('mesh')) return Network;
  if (type.includes('vpn') || type.includes('firewall')) return Shield;

  if (type.includes('storage') || type.includes('archive')) return HardDrive;

  if (type.includes('search')) return Search;
  if (type.includes('vector') || type.includes('graph')) return Network;
  if (type.includes('time') || type.includes('series')) return Clock;
  if (type.includes('db') || type.includes('warehouse')) return Database;

  if (type.includes('cache') || type.includes('session')) return Zap;

  if (type.includes('queue') || type.includes('dlq') || type.includes('bus') || type.includes('pub-sub')) return Workflow;
  if (type.includes('stream')) return Activity;

  if (type.includes('auth') || type.includes('identity')) return Fingerprint;
  if (type.includes('secret') || type.includes('kms') || type.includes('key')) return Key;
  if (type.includes('cert') || type.includes('security')) return Lock;

  if (type.includes('log')) return FileText;
  if (type.includes('metric') || type.includes('monitor') || type.includes('alert')) return LineChart;
  if (type.includes('trace')) return Activity;

  if (type.includes('llm') || type.includes('model') || type.includes('prompt') || type.includes('inference')) return BrainCircuit;
  if (type.includes('agent')) return Bot;

  if (type.includes('payment')) return CreditCard;
  if (type.includes('email')) return Mail;
  if (type.includes('sms') || type.includes('push')) return MessageSquare;
  if (type.includes('webhook') || type.includes('api')) return Cloud;

  if (type.includes('etl') || type.includes('analytics') || type.includes('lake')) return BarChart3;

  if (type.includes('pipeline') || type.includes('cicd')) return TerminalSquare;
  if (type.includes('registry')) return Layers;

  return Box;
}