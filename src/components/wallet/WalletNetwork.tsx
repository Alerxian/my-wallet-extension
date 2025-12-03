import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle
} from "~components/ui/field"
import { RadioGroup, RadioGroupItem } from "~components/ui/radio-group"
import { useWalletStore } from "~stores/walletStore"
import { DEFAULT_NETWORK } from "~types/wallet"

export const WalletNetwork = () => {
  const currentNetwork = useWalletStore((state) => state.currentNetwork)
  const switchNetwork = useWalletStore((state) => state.switchNetwork)

  return (
    <div className="w-full mt-4">
      <RadioGroup
        defaultValue={String(currentNetwork?.id || 0)}
        onValueChange={(value) => {
          switchNetwork(value)
        }}>
        {DEFAULT_NETWORK.map((network) => (
          <FieldLabel key={network.id} htmlFor={`${network.id}-r2h`}>
            <Field
              orientation="horizontal"
              className="flex items-center gap-2 px-6">
              <FieldContent>
                <FieldTitle>{network.name}</FieldTitle>
                <FieldDescription>{network.chainId}</FieldDescription>
                <div
                  className="text-sm text-muted-foreground break-all w-[80%]"
                  style={{
                    wordBreak: "break-all",
                    whiteSpace: "normal",
                    overflowWrap: "anywhere"
                  }}>
                  {network.rpcUrl}
                </div>
              </FieldContent>
              <RadioGroupItem value={network.id} id={`${network.id}-r2h`} />
            </Field>
          </FieldLabel>
        ))}
      </RadioGroup>
    </div>
  )
}
