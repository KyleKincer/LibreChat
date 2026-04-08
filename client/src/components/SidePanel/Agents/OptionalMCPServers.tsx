import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Dialog, DialogPanel, DialogTitle, Description } from '@headlessui/react';
import { Checkbox } from '@librechat/client';
import { useFormContext, useWatch } from 'react-hook-form';
import type { AgentForm } from '~/common';
import { useAgentPanelContext } from '~/Providers';
import { useLocalize } from '~/hooks';
import { cn } from '~/utils';

type OptionalServerEntry = {
  serverName: string;
  title: string;
  description: string;
};

const searchInputClass = cn(
  'h-full w-full bg-transparent text-sm text-token-text-primary',
  'focus:outline-none',
);

export default function OptionalMCPServers() {
  const localize = useLocalize();
  const { control, setValue } = useFormContext<AgentForm>();
  const { availableMCPServers } = useAgentPanelContext();
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const selectedServerNames = useWatch({ control, name: 'availableMcpServers' }) ?? [];

  const selectableServers = useMemo(
    () =>
      availableMCPServers
        .filter((server) => !server.consumeOnly)
        .map((server) => ({
          serverName: server.serverName,
          title: server.config.title || server.serverName,
          description: server.config.description || localize('com_ui_mcp_no_description'),
        }))
        .sort((a, b) => a.title.localeCompare(b.title)),
    [availableMCPServers, localize],
  );

  const selectableServerMap = useMemo(
    () => new Map(selectableServers.map((server) => [server.serverName, server])),
    [selectableServers],
  );

  const selectedServers = useMemo<OptionalServerEntry[]>(
    () =>
      selectedServerNames.map((serverName) => {
        const server = selectableServerMap.get(serverName);
        if (server) {
          return server;
        }

        return {
          serverName,
          title: serverName,
          description: localize('com_ui_unavailable'),
        };
      }),
    [localize, selectableServerMap, selectedServerNames],
  );

  const filteredServers = useMemo(() => {
    if (!searchValue) {
      return selectableServers;
    }

    const normalizedSearch = searchValue.toLowerCase();
    return selectableServers.filter(
      (server) =>
        server.title.toLowerCase().includes(normalizedSearch) ||
        server.serverName.toLowerCase().includes(normalizedSearch) ||
        server.description.toLowerCase().includes(normalizedSearch),
    );
  }, [searchValue, selectableServers]);

  const selectedSet = useMemo(() => new Set(selectedServerNames), [selectedServerNames]);

  const toggleServerSelection = (serverName: string) => {
    const nextSelection = selectedSet.has(serverName)
      ? selectedServerNames.filter((name) => name !== serverName)
      : [...selectedServerNames, serverName].sort((a, b) => a.localeCompare(b));

    setValue('availableMcpServers', nextSelection, { shouldDirty: true });
  };

  if (selectableServers.length === 0 && selectedServers.length === 0) {
    return null;
  }

  return (
    <>
      <div className="mb-4">
        <div className="mb-2">
          <label className="text-token-text-primary block text-sm font-medium">
            {localize('com_agents_optional_mcp_servers')}
          </label>
          <p className="mt-1 text-sm text-text-secondary">
            {localize('com_agents_optional_mcp_servers_description')}
          </p>
        </div>
        <div className="mb-2 space-y-1">
          {selectedServers.length > 0 ? (
            selectedServers.map((server) => (
              <div
                key={server.serverName}
                className="rounded-lg border border-border-light bg-surface-secondary px-3 py-2"
              >
                <div className="text-sm font-medium text-token-text-primary">{server.title}</div>
                <div className="text-xs text-text-secondary">{server.serverName}</div>
              </div>
            ))
          ) : (
            <p className="text-sm text-text-secondary">
              {localize('com_agents_optional_mcp_servers_empty')}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            setSearchValue('');
            setIsOpen(true);
          }}
          className="btn btn-neutral border-token-border-light relative h-9 w-full rounded-lg font-medium"
          aria-haspopup="dialog"
        >
          <div className="flex w-full items-center justify-center gap-2">
            {localize('com_agents_select_optional_mcp_servers')}
          </div>
        </button>
      </div>

      <Dialog open={isOpen} onClose={setIsOpen} className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-4 text-center">
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          <DialogPanel className="relative z-10 w-full max-w-2xl transform overflow-hidden rounded-2xl border border-border-light bg-surface-primary p-6 text-left align-middle shadow-xl transition-all">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <DialogTitle className="text-lg font-medium leading-6 text-text-primary">
                  {localize('com_agents_select_optional_mcp_servers')}
                </DialogTitle>
                <Description className="text-sm text-text-secondary">
                  {localize('com_agents_optional_mcp_servers_description')}
                </Description>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-2 text-text-secondary transition hover:bg-surface-hover hover:text-text-primary"
                aria-label={localize('com_ui_close')}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-4 flex items-center gap-2 rounded-lg border border-border-light bg-surface-secondary px-3 py-2">
              <Search className="h-4 w-4 text-text-secondary" />
              <input
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={localize('com_agents_optional_mcp_servers_search')}
                className={searchInputClass}
              />
            </div>

            <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
              {filteredServers.length > 0 ? (
                filteredServers.map((server) => {
                  const checkboxId = `optional-mcp-${server.serverName}`;
                  return (
                    <label
                      key={server.serverName}
                      htmlFor={checkboxId}
                      className="flex cursor-pointer items-start gap-3 rounded-lg border border-border-light bg-surface-secondary px-3 py-2 transition hover:bg-surface-hover"
                    >
                      <Checkbox
                        id={checkboxId}
                        checked={selectedSet.has(server.serverName)}
                        onCheckedChange={() => toggleServerSelection(server.serverName)}
                        className="mt-0.5"
                        aria-label={server.title}
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-token-text-primary">
                          {server.title}
                        </div>
                        <div className="text-xs text-text-secondary">{server.serverName}</div>
                        <div className="mt-1 text-sm text-text-secondary">{server.description}</div>
                      </div>
                    </label>
                  );
                })
              ) : (
                <p className="py-4 text-center text-sm text-text-secondary">
                  {localize('com_ui_no_results')}
                </p>
              )}
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}
