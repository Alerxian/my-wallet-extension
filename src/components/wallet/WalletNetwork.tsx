import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle
} from "~components/ui/field"
import { RadioGroup, RadioGroupItem } from "~components/ui/radio-group"
import { useWalletStore } from "~stores/walletStore"

export const WalletNetwork = () => {
  const currentChain = useWalletStore((state) => state.currentChain)
  const networks = useWalletStore((state) => state.networksByChain[state.currentChain])
  const currentNetwork = useWalletStore(
    (state) => state.currentNetworkByChain[state.currentChain]
  )
  const switchNetwork = useWalletStore((state) => state.switchNetwork)

  return (
    <div className="w-full mt-4">
      <div className="text-sm text-muted-foreground mb-3">Chain: {currentChain}</div>
      <RadioGroup
        value={String(currentNetwork?.id || "")}
        onValueChange={(value) => switchNetwork(value, currentChain)}>
        {networks.map((network) => (
          <FieldLabel key={network.id} htmlFor={`${network.id}-network`}>
            <Field orientation="horizontal" className="flex items-center gap-2 px-4 py-2">
              <FieldContent>
                <FieldTitle>{network.name}</FieldTitle>
                <FieldDescription>{String(network.chainId || "-")}</FieldDescription>
                <div
                  className="text-sm text-muted-foreground break-all w-[85%]"
                  style={{ wordBreak: "break-all", whiteSpace: "normal", overflowWrap: "anywhere" }}>
                  {network.rpcUrl}
                </div>
              </FieldContent>
              <RadioGroupItem value={network.id} id={`${network.id}-network`} />
            </Field>
          </FieldLabel>
        ))}
      </RadioGroup>
    </div>
  )
}
