import random

class NumberGuessingGame:
    def __init__(self):
        self.number = random.randint(1, 100)
        self.attempts = 0
        self.max_attempts = 7
        
    def play(self):
        print("🎯 Welcome to the Number Guessing Game!")
        print(f"I'm thinking of a number between 1 and 100.")
        print(f"You have {self.max_attempts} attempts to guess it!")
        print("-" * 40)
        
        while self.attempts < self.max_attempts:
            try:
                guess = int(input(f"\nAttempt {self.attempts + 1}/{self.max_attempts} - Enter your guess: "))
                self.attempts += 1
                
                if guess == self.number:
                    print(f"🎉 Congratulations! You guessed it in {self.attempts} attempts!")
                    return True
                elif guess < self.number:
                    remaining = self.max_attempts - self.attempts
                    if remaining > 0:
                        print(f"📈 Too low! {remaining} attempts remaining.")
                    else:
                        break
                else:
                    remaining = self.max_attempts - self.attempts
                    if remaining > 0:
                        print(f"📉 Too high! {remaining} attempts remaining.")
                    else:
                        break
                        
            except ValueError:
                print("❌ Please enter a valid number!")
                
        print(f"\n💀 Game Over! The number was {self.number}")
        return False

class RockPaperScissors:
    def __init__(self):
        self.choices = ['rock', 'paper', 'scissors']
        self.player_score = 0
        self.computer_score = 0
        
    def play(self):
        print("✂️ Welcome to Rock, Paper, Scissors!")
        print("Best of 5 rounds wins!")
        print("Type 'quit' to exit anytime")
        print("-" * 40)
        
        round_num = 1
        
        while self.player_score < 3 and self.computer_score < 3:
            print(f"\n🏆 Round {round_num}")
            print(f"Score - You: {self.player_score}, Computer: {self.computer_score}")
            
            player_choice = input("Enter rock, paper, or scissors: ").lower().strip()
            
            if player_choice == 'quit':
                print("Thanks for playing! 👋")
                return
                
            if player_choice not in self.choices:
                print("❌ Invalid choice! Please try again.")
                continue
                
            computer_choice = random.choice(self.choices)
            print(f"Computer chose: {computer_choice}")
            
            result = self.determine_winner(player_choice, computer_choice)
            
            if result == 'win':
                self.player_score += 1
                print("🎉 You win this round!")
            elif result == 'lose':
                self.computer_score += 1
                print("😢 Computer wins this round!")
            else:
                print("🤝 It's a tie!")
                
            round_num += 1
            
        if self.player_score == 3:
            print(f"\n🏆 GAME OVER - YOU WIN! Final score: {self.player_score}-{self.computer_score}")
        else:
            print(f"\n💻 GAME OVER - Computer wins! Final score: {self.player_score}-{self.computer_score}")
    
    def determine_winner(self, player, computer):
        if player == computer:
            return 'tie'
        elif (player == 'rock' and computer == 'scissors') or \
             (player == 'paper' and computer == 'rock') or \
             (player == 'scissors' and computer == 'paper'):
            return 'win'
        else:
            return 'lose'

def main():
    print("🎮 Python Game Collection")
    print("=" * 30)
    print("1. Number Guessing Game")
    print("2. Rock, Paper, Scissors")
    print("3. Exit")
    
    while True:
        try:
            choice = input("\nSelect a game (1-3): ").strip()
            
            if choice == '1':
                game = NumberGuessingGame()
                game.play()
                
                play_again = input("\nPlay again? (y/n): ").lower()
                if play_again != 'y':
                    break
                    
            elif choice == '2':
                game = RockPaperScissors()
                game.play()
                
                play_again = input("\nPlay again? (y/n): ").lower()
                if play_again != 'y':
                    break
                    
            elif choice == '3':
                print("Thanks for playing! 🎯")
                break
                
            else:
                print("❌ Invalid choice! Please select 1, 2, or 3.")
                
        except KeyboardInterrupt:
            print("\n\nGoodbye! 👋")
            break

if __name__ == "__main__":
    main()