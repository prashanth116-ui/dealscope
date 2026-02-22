import { TextInput, TextInputProps, StyleSheet } from "react-native";

interface CurrencyInputProps extends Omit<TextInputProps, "onChangeText"> {
  value: string;
  onChangeValue: (raw: string) => void;
}

export function CurrencyInput({
  value,
  onChangeValue,
  style,
  ...props
}: CurrencyInputProps) {
  const handleChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, "");
    onChangeValue(cleaned);
  };

  const display = value
    ? `$${Number(value).toLocaleString("en-US", { maximumFractionDigits: 0 })}`
    : "";

  return (
    <TextInput
      style={[styles.input, style]}
      keyboardType="numeric"
      value={display}
      onChangeText={handleChange}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fafafa",
  },
});
