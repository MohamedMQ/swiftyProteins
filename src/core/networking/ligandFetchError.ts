import type { ComponentProps } from 'react';
import type Ionicons from '@expo/vector-icons/Ionicons';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export type LigandFetchError =
  | { type: 'noConnection' }
  | { type: 'notFound' }
  | { type: 'timeout' }
  | { type: 'parseFailure' }
  | { type: 'serverError'; status: number };

/** Exact copy matches the subject's required message strings. */
export function getLigandFetchErrorMessage(error: LigandFetchError): string {
  switch (error.type) {
    case 'noConnection':
      return 'No internet connection. Please check your network.';
    case 'notFound':
      return 'Ligand not found (404). This ligand may not exist in the database.';
    case 'parseFailure':
      return 'Failed to parse ligand data. The file may be corrupted.';
    case 'timeout':
      return 'Request timeout. Please try again.';
    case 'serverError':
      return `Server error (${error.status}). Please try again later.`;
  }
}

/** Short headline for the alert card; the full required copy is the message below it. */
export function getLigandFetchErrorTitle(error: LigandFetchError): string {
  switch (error.type) {
    case 'noConnection':
      return 'No internet connection';
    case 'notFound':
      return 'Ligand not found';
    case 'parseFailure':
      return "Couldn't read ligand data";
    case 'timeout':
      return 'Request timed out';
    case 'serverError':
      return 'Server error';
  }
}

export function getLigandFetchErrorIcon(error: LigandFetchError): IoniconName {
  switch (error.type) {
    case 'noConnection':
      return 'cloud-offline-outline';
    case 'notFound':
      return 'help-circle-outline';
    case 'parseFailure':
      return 'document-outline';
    case 'timeout':
      return 'time-outline';
    case 'serverError':
      return 'warning-outline';
  }
}
