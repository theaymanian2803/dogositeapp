import { render, fireEvent } from "@testing-library/react-native";
import { Button } from "./Button";

jest.mock("../../theme/theme", () => ({
  useTheme: () => ({
    colors: {
      accent: "#2F6B58",
      background: "#FFFFFF",
      foreground: "#1C3B31",
      secondary: "#F4F6F5",
      muted: "#F3F5F4",
      card: "#FFFFFF",
      border: "#E4E8E6",
    },
    currency: "MAD",
  }),
}));

describe("Button", () => {
  it("renders its label and handles presses", async () => {
    const onPress = jest.fn();
    const { getByText } = await render(<Button label="Add to Cart" onPress={onPress} />);
    await fireEvent.press(getByText("Add to Cart"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
  it("does not fire while loading", async () => {
    const onPress = jest.fn();
    const { getByRole } = await render(<Button label="Saving" onPress={onPress} loading />);
    await fireEvent.press(getByRole("button"));
    expect(onPress).not.toHaveBeenCalled();
  });
});
